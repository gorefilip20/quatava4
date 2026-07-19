import { 
  verifyWebhookSignature, 
  getDLocalConfig, 
  DLOCAL_STATUS_MAPPING,
  DLocalWebhookPayload 
} from "./utils";
import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { sendFiatTransactionEmail } from "@b/utils/emails";
import { createNotification, createAdminNotification } from "@b/utils/notifications";

export const metadata: OperationObject = {
  summary: "dLocal webhook handler",
  description: "Handles payment notifications from dLocal with HMAC signature verification",
  operationId: "dLocalWebhook",
  tags: ["Finance", "Webhook"],
  requestBody: {
    description: "dLocal webhook payload",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            id: { type: "string" },
            amount: { type: "number" },
            currency: { type: "string" },
            payment_method_id: { type: "string" },
            payment_method_type: { type: "string" },
            country: { type: "string" },
            status: { type: "string" },
            status_code: { type: "number" },
            status_detail: { type: "string" },
            order_id: { type: "string" },
            created_date: { type: "string" },
            approved_date: { type: "string", nullable: true },
            live: { type: "boolean" },
          },
          required: ["id", "amount", "currency", "status", "order_id"],
        },
      },
    },
  },
  responses: {
    200: {
      description: "Webhook processed successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: { type: "string" },
              status: { type: "string" },
            },
          },
        },
      },
    },
    400: {
      description: "Bad request or invalid signature",
    },
    404: {
      description: "Transaction not found",
    },
    500: {
      description: "Internal server error",
    },
  },
  requiresAuth: false,
};

export default async (data: Handler) => {
  const { body, headers } = data;

  try {
    // Get dLocal configuration
    const config = getDLocalConfig();

    // Extract headers for signature verification
    const xDate = headers["x-date"] as string;
    const authorization = headers["authorization"] as string;

    if (!xDate || !authorization) {
      throw new Error("Missing required headers for signature verification");
    }

    // Verify webhook signature
    const requestBody = JSON.stringify(body);
    const isValidSignature = verifyWebhookSignature(
      authorization,
      config.xLogin,
      xDate,
      requestBody,
      config.secretKey
    );

    if (!isValidSignature) {
      console.error("dLocal webhook signature verification failed");
      throw new Error("Invalid webhook signature");
    }

    const payload: DLocalWebhookPayload = body;
    
    console.log(`dLocal webhook received for payment ${payload.id}, order ${payload.order_id}, status: ${payload.status}`);

    // Find the transaction by order ID
    const transaction = await models.transaction.findOne({
      where: { uuid: payload.order_id },
      include: [
        {
          model: models.user,
          as: "user",
          include: [
            {
              model: models.wallet,
              as: "wallets",
            },
          ],
        },
      ],
    });

    if (!transaction) {
      console.error(`Transaction not found for order ID: ${payload.order_id}`);
      throw new Error("Transaction not found");
    }

    // Map dLocal status to internal status
    const internalStatus = DLOCAL_STATUS_MAPPING[payload.status] || "pending";
    const previousStatus = transaction.status;

    // Update transaction with webhook data
    await transaction.update({
      status: internalStatus.toUpperCase(),
      metadata: JSON.stringify({
        ...transaction.metadata,
        dlocal_payment_id: payload.id,
        dlocal_status: payload.status,
        dlocal_status_code: payload.status_code,
        dlocal_status_detail: payload.status_detail,
        payment_method_type: payload.payment_method_type,
        approved_date: payload.approved_date,
        webhook_received_at: new Date().toISOString(),
        live: payload.live,
      }),
    });

    // Handle successful payment
    if (payload.status === "PAID" && previousStatus !== "COMPLETED") {
      const user = transaction.user;
      const currency = payload.currency;

      // Find or create user wallet for this currency
      let wallet = user.wallets?.find((w) => w.currency === currency);
      
      if (!wallet) {
        wallet = await models.wallet.create({
          userId: user.id,
          currency: currency,
          type: "FIAT",
          balance: 0,
          inOrder: 0,
        });
      }

      // Calculate the deposit amount (excluding fees)
      const depositAmount = transaction.amount;

      // Update wallet balance
      await wallet.update({
        balance: Number(wallet.balance) + Number(depositAmount),
      });

      console.log(`Wallet updated for user ${user.id}: +${depositAmount} ${currency}`);

      // Send email notification
      try {
        await sendFiatTransactionEmail(
          user,
          transaction,
          currency,
          Number(wallet.balance)
        );
        console.log(`Deposit success email sent to ${user.email}`);
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }

      // Log the successful deposit
      console.log(`dLocal deposit completed: ${payload.id}, amount: ${depositAmount} ${currency}, user: ${user.id}`);
    }

    // Handle failed payment
    if (["REJECTED", "CANCELLED", "EXPIRED"].includes(payload.status)) {
      console.log(`dLocal payment failed: ${payload.id}, status: ${payload.status}, detail: ${payload.status_detail}`);
      
      // Send failure notification email
      try {
        const user = transaction.user;
        const currency = payload.currency;

        // Find user wallet (no balance change for failed payment)
        const wallet = user.wallets?.find((w) => w.currency === currency);
        const currentBalance = wallet ? Number(wallet.balance) : 0;

        await sendFiatTransactionEmail(
          user,
          transaction,
          currency,
          currentBalance
        );

        // Also create an in-app notification
        await createNotification({
          userId: user.id,
          title: "Deposit Failed",
          type: "alert",
          message: `Your ${currency} deposit of ${transaction.amount} has failed. Status: ${payload.status}. ${payload.status_detail || ""}`,
        });

        console.log(`Failure notification sent to ${user.email}`);
      } catch (emailError) {
        console.error("Failed to send failure notification:", emailError);
      }
    }

    // Handle refunds
    if (["REFUNDED", "PARTIALLY_REFUNDED"].includes(payload.status)) {
      console.log(`dLocal payment refunded: ${payload.id}, status: ${payload.status}`);
      
      const user = transaction.user;
      const currency = payload.currency;
      const refundAmount = Number(transaction.amount);

      // Only debit wallet if the deposit was previously completed
      if (previousStatus === "COMPLETED") {
        // Find user wallet for this currency
        let wallet = user.wallets?.find((w) => w.currency === currency);

        if (!wallet) {
          // Wallet should exist since deposit was completed, but handle edge case
          console.error(`Wallet not found for user ${user.id} and currency ${currency} during refund`);
        } else {
          // Debit the wallet (subtract the deposited amount)
          await wallet.update({
            balance: Number(wallet.balance) - refundAmount,
          });

          console.log(`Wallet debited for refund: user ${user.id}, -${refundAmount} ${currency}, new balance: ${Number(wallet.balance)}`);

          // Send refund notification email
          try {
            await sendFiatTransactionEmail(
              user,
              transaction,
              currency,
              Number(wallet.balance)
            );
          } catch (emailError) {
            console.error("Failed to send refund email:", emailError);
          }

          // Create in-app notification
          try {
            await createNotification({
              userId: user.id,
              title: "Deposit Refunded",
              type: "alert",
              message: `Your ${currency} deposit of ${refundAmount} has been refunded. The amount has been deducted from your wallet.`,
            });
          } catch (notifError) {
            console.error("Failed to create refund notification:", notifError);
          }
        }
      } else {
        console.log(`Refund webhook received for non-completed transaction (${previousStatus}), skipping wallet debit`);
      }
    }

    // Handle chargebacks
    if (payload.status === "CHARGEBACK") {
      console.log(`dLocal payment chargeback: ${payload.id}`);
      
      const user = transaction.user;
      const currency = payload.currency;
      const chargebackAmount = Number(transaction.amount);

      // Only debit wallet if the deposit was previously completed
      if (previousStatus === "COMPLETED") {
        // Find user wallet for this currency
        let wallet = user.wallets?.find((w) => w.currency === currency);

        if (!wallet) {
          console.error(`Wallet not found for user ${user.id} and currency ${currency} during chargeback`);
        } else {
          // Debit the wallet (subtract the deposited amount)
          await wallet.update({
            balance: Number(wallet.balance) - chargebackAmount,
          });

          console.log(`Wallet debited for chargeback: user ${user.id}, -${chargebackAmount} ${currency}, new balance: ${Number(wallet.balance)}`);

          // Send chargeback notification email
          try {
            await sendFiatTransactionEmail(
              user,
              transaction,
              currency,
              Number(wallet.balance)
            );
          } catch (emailError) {
            console.error("Failed to send chargeback email:", emailError);
          }

          // Create in-app notification for user
          try {
            await createNotification({
              userId: user.id,
              title: "Deposit Chargeback",
              type: "alert",
              message: `Your ${currency} deposit of ${chargebackAmount} has been charged back. The amount has been deducted from your wallet. Please contact support if you have questions.`,
            });
          } catch (notifError) {
            console.error("Failed to create chargeback notification:", notifError);
          }

          // Alert admin about the chargeback
          try {
            await createAdminNotification(
              "finance.deposit.view",
              "Chargeback Alert",
              `A chargeback of ${chargebackAmount} ${currency} has been processed for user ${user.id} (${user.email}). Transaction: ${transaction.id}. dLocal payment: ${payload.id}.`,
              "alert"
            );
          } catch (adminNotifError) {
            console.error("Failed to create admin chargeback notification:", adminNotifError);
          }
        }
      } else {
        console.log(`Chargeback webhook received for non-completed transaction (${previousStatus}), skipping wallet debit`);
      }
    }

    return {
      message: "Webhook processed successfully",
      status: "ok",
    };

  } catch (error) {
    console.error("dLocal webhook processing error:", error);
    
    // Return error response
    throw new Error(error.message || "Webhook processing failed");
  }
}; 