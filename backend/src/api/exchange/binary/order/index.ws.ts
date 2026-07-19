import { models } from "@b/db";
import { messageBroker, hasClients } from "@b/handler/Websocket";
import { logError } from "@b/utils/logger";
import { Op } from "sequelize";

export const metadata = {};

class BinaryOrderHandler {
  private static instance: BinaryOrderHandler;
  private trackedOrders: { [userId: string]: any[] } = {};
  private watchedUserIds: Set<string> = new Set();
  private orderInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.addUserToWatchlist = this.addUserToWatchlist.bind(this);
    this.removeUserFromWatchlist = this.removeUserFromWatchlist.bind(this);
  }

  public static getInstance(): BinaryOrderHandler {
    if (!BinaryOrderHandler.instance) {
      BinaryOrderHandler.instance = new BinaryOrderHandler();
    }
    return BinaryOrderHandler.instance;
  }

  private startInterval() {
    if (!this.orderInterval) {
      this.orderInterval = setInterval(this.flushOrders.bind(this), 1000);
    }
  }

  private stopInterval() {
    if (this.orderInterval) {
      clearInterval(this.orderInterval);
      this.orderInterval = null;
    }
  }

  private flushOrders() {
    if (Object.keys(this.trackedOrders).length > 0) {
      const route = "/api/exchange/binary/order";
      const streamKey = "orders";
      Object.keys(this.trackedOrders).forEach((userId) => {
        let orders = this.trackedOrders[userId];
        if (orders && orders.length > 0) {
          const seenOrders = new Set();
          orders = orders.filter((order) => {
            const isDuplicate = seenOrders.has(order.id);
            seenOrders.add(order.id);
            return !isDuplicate;
          });

          if (orders.length > 0) {
            messageBroker.broadcastToSubscribedClients(
              route,
              { type: "orders", userId },
              { stream: streamKey, data: orders }
            );
          }
        }
      });
      this.trackedOrders = {};
    } else {
      this.stopInterval();
    }
  }

  public addUserToWatchlist(userId: string) {
    if (!this.watchedUserIds.has(userId)) {
      this.watchedUserIds.add(userId);
      this.trackedOrders[userId] = this.trackedOrders[userId] || [];
      if (!this.orderInterval) {
        this.startInterval();
      }
    }
  }

  public removeUserFromWatchlist(userId: string) {
    if (this.watchedUserIds.has(userId)) {
      this.watchedUserIds.delete(userId);
      delete this.trackedOrders[userId];
    }
  }

  private async fetchAndUpdateOrders(userId: string) {
    try {
      const userOrders = await models.binaryOrder.findAll({
        where: {
          userId,
          status: { [Op.in]: ["PENDING", "WIN", "LOSS", "DRAW", "CANCELED"] },
        },
        attributes: [
          "id",
          "userId",
          "symbol",
          "type",
          "side",
          "status",
          "price",
          "amount",
          "profit",
          "isDemo",
          "barrier",
          "strikePrice",
          "payoutPerPoint",
          "closedAt",
          "closePrice",
          "createdAt",
          "updatedAt",
        ],
        order: [["createdAt", "DESC"]],
        raw: true,
      });

      if (userOrders.length === 0) {
        this.removeUserFromWatchlist(userId);
        return;
      }

      const previousOrders = this.trackedOrders[userId] || [];
      const previousOrderMap = new Map(
        previousOrders.map((o: any) => [o.id, o])
      );

      // Detect status changes and new orders
      const changedOrders = userOrders.filter((order) => {
        const prev = previousOrderMap.get(order.id);
        if (!prev) return true; // New order
        return prev.status !== order.status; // Status changed
      });

      if (changedOrders.length > 0) {
        this.trackedOrders[userId] = this.trackedOrders[userId] || [];
        for (const order of changedOrders) {
          this.trackedOrders[userId].push(order);
        }
      }

      // Keep only active orders in watchlist
      const activeOrders = userOrders.filter(
        (o: any) => o.status === "PENDING"
      );
      if (activeOrders.length === 0) {
        this.removeUserFromWatchlist(userId);
      }
    } catch (error) {
      logError("binary", error, __filename);
    }
  }

  public async fetchOrdersForUser(userId: string) {
    while (
      hasClients("/api/exchange/binary/order") &&
      this.watchedUserIds.has(userId)
    ) {
      await this.fetchAndUpdateOrders(userId);

      // Wait 5 seconds between polls
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    // Clean up if no more clients
    this.removeUserFromWatchlist(userId);
  }

  public async handleMessage(data: Handler, message: any) {
    if (typeof message === "string") {
      message = JSON.parse(message);
    }

    const { user } = data;
    if (!user?.id) {
      return;
    }

    const { action, payload } = message;

    if (action === "SUBSCRIBE") {
      const userId = payload?.userId;
      if (!userId || user.id !== userId) {
        return;
      }

      if (!this.watchedUserIds.has(userId)) {
        this.addUserToWatchlist(userId);
        // Fetch and broadcast initial orders, then continue polling
        this.fetchOrdersForUser(userId);
      }
    } else if (action === "UNSUBSCRIBE") {
      const userId = payload?.userId;
      if (userId) {
        this.removeUserFromWatchlist(userId);
      }
    }
  }
}

export default async (data: Handler, message: any) => {
  const handler = BinaryOrderHandler.getInstance();
  await handler.handleMessage(data, message);
};
