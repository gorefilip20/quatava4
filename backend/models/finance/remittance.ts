import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

interface remittanceAttributes {
  id: string;
  userId: string;
  sendCurrency: string;
  sendAmount: number;
  receiveCurrency: string;
  receiveAmount: number;
  recipientName: string;
  recipientAccount: string;
  recipientBank: string | null;
  corridor: string;
  exchangeRate: number;
  fee: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  estimatedDelivery: Date;
  completedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type remittanceCreationAttributes = Sequelize.Optional<remittanceAttributes, "id" | "completedAt" | "createdAt" | "updatedAt">;

export default class remittance extends Model<remittanceAttributes, remittanceCreationAttributes> implements remittanceAttributes {
  id!: string;
  userId!: string;
  sendCurrency!: string;
  sendAmount!: number;
  receiveCurrency!: string;
  receiveAmount!: number;
  recipientName!: string;
  recipientAccount!: string;
  recipientBank!: string | null;
  corridor!: string;
  exchangeRate!: number;
  fee!: number;
  status!: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  estimatedDelivery!: Date;
  completedAt!: Date | null;
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof remittance {
    return remittance.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
        userId: { type: DataTypes.UUID, allowNull: false },
        sendCurrency: { type: DataTypes.STRING(20), allowNull: false },
        sendAmount: { type: DataTypes.DOUBLE, allowNull: false },
        receiveCurrency: { type: DataTypes.STRING(20), allowNull: false },
        receiveAmount: { type: DataTypes.DOUBLE, allowNull: false },
        recipientName: { type: DataTypes.STRING(255), allowNull: false },
        recipientAccount: { type: DataTypes.STRING(255), allowNull: false },
        recipientBank: { type: DataTypes.STRING(255), allowNull: true },
        corridor: { type: DataTypes.STRING(10), allowNull: false },
        exchangeRate: { type: DataTypes.DOUBLE, allowNull: false },
        fee: { type: DataTypes.DOUBLE, allowNull: false },
        status: { type: DataTypes.ENUM("PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"), allowNull: false, defaultValue: "PENDING" },
        estimatedDelivery: { type: DataTypes.DATE, allowNull: false },
        completedAt: { type: DataTypes.DATE, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: true },
        updatedAt: { type: DataTypes.DATE, allowNull: true },
      },
      { sequelize, tableName: "remittance", timestamps: true, modelName: "remittance" }
    );
  }

  public static associate(models: any) {
    remittance.belongsTo(models.user, { foreignKey: "userId", as: "user" });
  }
}
