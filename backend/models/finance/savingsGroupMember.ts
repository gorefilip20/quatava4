import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

interface savingsGroupMemberAttributes {
  id: string;
  groupId: string;
  userId: string;
  payoutOrder: number;
  totalContributed: number;
  hasReceivedPayout: boolean;
  joinedAt: Date;
  status: "ACTIVE" | "LEFT" | "REMOVED";
  createdAt?: Date;
  updatedAt?: Date;
}

type savingsGroupMemberCreationAttributes = Sequelize.Optional<savingsGroupMemberAttributes, "id" | "totalContributed" | "hasReceivedPayout" | "createdAt" | "updatedAt">;

export default class savingsGroupMember extends Model<savingsGroupMemberAttributes, savingsGroupMemberCreationAttributes> implements savingsGroupMemberAttributes {
  id!: string;
  groupId!: string;
  userId!: string;
  payoutOrder!: number;
  totalContributed!: number;
  hasReceivedPayout!: boolean;
  joinedAt!: Date;
  status!: "ACTIVE" | "LEFT" | "REMOVED";
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof savingsGroupMember {
    return savingsGroupMember.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
        groupId: { type: DataTypes.UUID, allowNull: false },
        userId: { type: DataTypes.UUID, allowNull: false },
        payoutOrder: { type: DataTypes.INTEGER, allowNull: false },
        totalContributed: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 },
        hasReceivedPayout: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        joinedAt: { type: DataTypes.DATE, allowNull: false },
        status: { type: DataTypes.ENUM("ACTIVE", "LEFT", "REMOVED"), allowNull: false, defaultValue: "ACTIVE" },
        createdAt: { type: DataTypes.DATE, allowNull: true },
        updatedAt: { type: DataTypes.DATE, allowNull: true },
      },
      { sequelize, tableName: "savings_group_member", timestamps: true, modelName: "savingsGroupMember" }
    );
  }

  public static associate(models: any) {
    savingsGroupMember.belongsTo(models.savingsGroup, { foreignKey: "groupId", as: "group" });
    savingsGroupMember.belongsTo(models.user, { foreignKey: "userId", as: "user" });
  }
}
