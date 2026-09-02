import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

interface merchantTransactionAttributes {
  id: string;
  merchantId: string;
  orderId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  status: "PENDING" | "COMPLETED" | "EXPIRED" | "REFUNDED";
  paidAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

type merchantTransactionCreationAttributes = Sequelize.Optional<
  merchantTransactionAttributes,
  "id" | "status" | "createdAt" | "updatedAt"
>;

export default class merchantTransaction
  extends Model<merchantTransactionAttributes, merchantTransactionCreationAttributes>
  implements merchantTransactionAttributes
{
  id!: string;
  merchantId!: string;
  orderId!: string;
  amount!: number;
  currency!: string;
  customerEmail?: string;
  status!: "PENDING" | "COMPLETED" | "EXPIRED" | "REFUNDED";
  paidAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof merchantTransaction {
    return merchantTransaction.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        merchantId: {
          type: DataTypes.UUID,
          allowNull: false,
          validate: {
            notNull: { msg: "merchantId: Merchant ID cannot be null" },
            isUUID: { args: 4, msg: "merchantId: Merchant ID must be a valid UUID" },
          },
          comment: "ID of the merchant profile this transaction belongs to",
        },
        orderId: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: {
            notEmpty: { msg: "orderId: Order ID cannot be empty" },
          },
          comment: "External order identifier from the merchant",
        },
        amount: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          validate: {
            isFloat: { msg: "amount: Amount must be a number" },
            min: { args: [0], msg: "amount: Amount must be positive" },
          },
          comment: "Payment amount",
        },
        currency: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: {
            notEmpty: { msg: "currency: Currency cannot be empty" },
          },
          comment: "Payment currency symbol",
        },
        customerEmail: {
          type: DataTypes.STRING(255),
          allowNull: true,
          validate: {
            isEmail: { msg: "customerEmail: Must be a valid email" },
          },
          comment: "Customer email address",
        },
        status: {
          type: DataTypes.ENUM("PENDING", "COMPLETED", "EXPIRED", "REFUNDED"),
          allowNull: false,
          defaultValue: "PENDING",
          validate: {
            isIn: {
              args: [["PENDING", "COMPLETED", "EXPIRED", "REFUNDED"]],
              msg: "status: Must be one of PENDING, COMPLETED, EXPIRED, REFUNDED",
            },
          },
          comment: "Current status of the transaction",
        },
        paidAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: "When the payment was completed",
        },
      },
      {
        sequelize,
        modelName: "merchantTransaction",
        tableName: "merchant_transaction",
        timestamps: true,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "merchantTransactionMerchantIdKey",
            using: "BTREE",
            fields: [{ name: "merchantId" }],
          },
          {
            name: "merchantTransactionOrderIdKey",
            using: "BTREE",
            fields: [{ name: "orderId" }],
          },
        ],
      }
    );
  }

  public static associate(models: any) {
    merchantTransaction.belongsTo(models.merchantProfile, {
      as: "merchant",
      foreignKey: "merchantId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
}
