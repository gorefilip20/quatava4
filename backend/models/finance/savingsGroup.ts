import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

interface savingsGroupAttributes {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  contributionAmount: number;
  frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  maxMembers: number;
  currentMembers: number;
  currentRound: number;
  totalRounds: number;
  status: "FORMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  creatorId: string;
  startDate: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type savingsGroupCreationAttributes = Sequelize.Optional<savingsGroupAttributes, "id" | "description" | "currentMembers" | "currentRound" | "startDate" | "createdAt" | "updatedAt">;

export default class savingsGroup extends Model<savingsGroupAttributes, savingsGroupCreationAttributes> implements savingsGroupAttributes {
  id!: string;
  name!: string;
  description!: string | null;
  currency!: string;
  contributionAmount!: number;
  frequency!: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  maxMembers!: number;
  currentMembers!: number;
  currentRound!: number;
  totalRounds!: number;
  status!: "FORMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  creatorId!: string;
  startDate!: Date | null;
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof savingsGroup {
    return savingsGroup.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
        name: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        currency: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "USDT" },
        contributionAmount: { type: DataTypes.DOUBLE, allowNull: false },
        frequency: { type: DataTypes.ENUM("WEEKLY", "BIWEEKLY", "MONTHLY"), allowNull: false },
        maxMembers: { type: DataTypes.INTEGER, allowNull: false },
        currentMembers: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        currentRound: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        totalRounds: { type: DataTypes.INTEGER, allowNull: false },
        status: { type: DataTypes.ENUM("FORMING", "ACTIVE", "COMPLETED", "CANCELLED"), allowNull: false, defaultValue: "FORMING" },
        creatorId: { type: DataTypes.UUID, allowNull: false },
        startDate: { type: DataTypes.DATE, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: true },
        updatedAt: { type: DataTypes.DATE, allowNull: true },
      },
      { sequelize, tableName: "savings_group", timestamps: true, modelName: "savingsGroup" }
    );
  }

  public static associate(models: any) {
    savingsGroup.belongsTo(models.user, { foreignKey: "creatorId", as: "creator" });
  }
}
