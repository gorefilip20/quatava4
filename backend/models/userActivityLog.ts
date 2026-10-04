import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

export default class userActivityLog extends Model<userActivityLogAttributes, userActivityLogCreationAttributes> implements userActivityLogAttributes {
  id!: string; userId!: string; action!: string; category!: "SECURITY" | "WALLET" | "CARD" | "MARKET" | "PROFILE"; ipAddress?: string; userAgent?: string; metadata?: Record<string, unknown>; createdAt?: Date;
  public static initModel(sequelize: Sequelize.Sequelize): typeof userActivityLog {
    return userActivityLog.init({
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false }, userId: { type: DataTypes.UUID, allowNull: false }, action: { type: DataTypes.STRING(120), allowNull: false }, category: { type: DataTypes.ENUM("SECURITY", "WALLET", "CARD", "MARKET", "PROFILE"), allowNull: false }, ipAddress: { type: DataTypes.STRING(64), allowNull: true }, userAgent: { type: DataTypes.STRING(512), allowNull: true }, metadata: { type: DataTypes.JSON, allowNull: true },
    }, { sequelize, modelName: "userActivityLog", tableName: "user_activity_log", timestamps: true, updatedAt: false, indexes: [{ fields: ["userId", "createdAt"] }] });
  }
  public static associate(models: any) { userActivityLog.belongsTo(models.user, { as: "user", foreignKey: "userId", onDelete: "CASCADE" }); }
}
