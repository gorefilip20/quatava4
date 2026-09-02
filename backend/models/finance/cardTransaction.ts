import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

interface cardTransactionAttributes {
  id: string;
  cardId: string;
  userId: string;
  type: "PURCHASE" | "TOPUP" | "WITHDRAWAL" | "REFUND" | "CASHBACK";
  merchant: string | null;
  amount: number;
  currency: string;
  category: string | null;
  status: "COMPLETED" | "PENDING" | "FAILED";
  createdAt?: Date;
}

type cardTransactionCreationAttributes = Sequelize.Optional<cardTransactionAttributes, "id" | "merchant" | "category" | "createdAt">;

export default class cardTransaction extends Model<cardTransactionAttributes, cardTransactionCreationAttributes> implements cardTransactionAttributes {
  id!: string;
  cardId!: string;
  userId!: string;
  type!: "PURCHASE" | "TOPUP" | "WITHDRAWAL" | "REFUND" | "CASHBACK";
  merchant!: string | null;
  amount!: number;
  currency!: string;
  category!: string | null;
  status!: "COMPLETED" | "PENDING" | "FAILED";
  createdAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof cardTransaction {
    return cardTransaction.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
        cardId: { type: DataTypes.UUID, allowNull: false },
        userId: { type: DataTypes.UUID, allowNull: false },
        type: { type: DataTypes.ENUM("PURCHASE", "TOPUP", "WITHDRAWAL", "REFUND", "CASHBACK"), allowNull: false },
        merchant: { type: DataTypes.STRING(255), allowNull: true },
        amount: { type: DataTypes.DOUBLE, allowNull: false },
        currency: { type: DataTypes.STRING(20), allowNull: false },
        category: { type: DataTypes.STRING(100), allowNull: true },
        status: { type: DataTypes.ENUM("COMPLETED", "PENDING", "FAILED"), allowNull: false, defaultValue: "COMPLETED" },
        createdAt: { type: DataTypes.DATE, allowNull: true },
      },
      { sequelize, tableName: "card_transaction", timestamps: true, updatedAt: false, modelName: "cardTransaction" }
    );
  }

  public static associate(models: any) {
    cardTransaction.belongsTo(models.card, { foreignKey: "cardId", as: "card" });
  }
}
