import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

interface cardAttributes {
  id: string;
  userId: string;
  cardNumber: string;
  cardType: "VIRTUAL" | "PHYSICAL";
  tier: "STANDARD" | "PREMIUM" | "ELITE";
  currency: string;
  balance: number;
  spendingLimit: number;
  monthlySpent: number;
  status: "ACTIVE" | "FROZEN" | "CANCELLED";
  cashbackRate: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type cardCreationAttributes = Sequelize.Optional<cardAttributes, "id" | "balance" | "spendingLimit" | "monthlySpent" | "cashbackRate" | "createdAt" | "updatedAt">;

export default class card extends Model<cardAttributes, cardCreationAttributes> implements cardAttributes {
  id!: string;
  userId!: string;
  cardNumber!: string;
  cardType!: "VIRTUAL" | "PHYSICAL";
  tier!: "STANDARD" | "PREMIUM" | "ELITE";
  currency!: string;
  balance!: number;
  spendingLimit!: number;
  monthlySpent!: number;
  status!: "ACTIVE" | "FROZEN" | "CANCELLED";
  cashbackRate!: number;
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof card {
    return card.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
        userId: { type: DataTypes.UUID, allowNull: false },
        cardNumber: { type: DataTypes.STRING(4), allowNull: false },
        cardType: { type: DataTypes.ENUM("VIRTUAL", "PHYSICAL"), allowNull: false, defaultValue: "VIRTUAL" },
        tier: { type: DataTypes.ENUM("STANDARD", "PREMIUM", "ELITE"), allowNull: false, defaultValue: "STANDARD" },
        currency: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "USDT" },
        balance: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 },
        spendingLimit: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 1000 },
        monthlySpent: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 },
        status: { type: DataTypes.ENUM("ACTIVE", "FROZEN", "CANCELLED"), allowNull: false, defaultValue: "ACTIVE" },
        cashbackRate: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 1 },
        createdAt: { type: DataTypes.DATE, allowNull: true },
        updatedAt: { type: DataTypes.DATE, allowNull: true },
      },
      { sequelize, tableName: "card", timestamps: true, modelName: "card" }
    );
  }

  public static associate(models: any) {
    card.belongsTo(models.user, { foreignKey: "userId", as: "user" });
  }
}
