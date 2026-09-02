import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

interface referralRewardAttributes {
  id: string;
  userId: string;
  referralId: string;
  amount: number;
  type: "SIGNUP_BONUS" | "TRADE_COMMISSION" | "TIER_BONUS";
  status: "PENDING" | "CREDITED" | "EXPIRED";
  creditedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type referralRewardCreationAttributes = Sequelize.Optional<referralRewardAttributes, "id" | "creditedAt" | "createdAt" | "updatedAt">;

export default class referralReward extends Model<referralRewardAttributes, referralRewardCreationAttributes> implements referralRewardAttributes {
  id!: string;
  userId!: string;
  referralId!: string;
  amount!: number;
  type!: "SIGNUP_BONUS" | "TRADE_COMMISSION" | "TIER_BONUS";
  status!: "PENDING" | "CREDITED" | "EXPIRED";
  creditedAt!: Date | null;
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof referralReward {
    return referralReward.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
        userId: { type: DataTypes.UUID, allowNull: false },
        referralId: { type: DataTypes.UUID, allowNull: false },
        amount: { type: DataTypes.DOUBLE, allowNull: false },
        type: { type: DataTypes.ENUM("SIGNUP_BONUS", "TRADE_COMMISSION", "TIER_BONUS"), allowNull: false },
        status: { type: DataTypes.ENUM("PENDING", "CREDITED", "EXPIRED"), allowNull: false, defaultValue: "PENDING" },
        creditedAt: { type: DataTypes.DATE, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: true },
        updatedAt: { type: DataTypes.DATE, allowNull: true },
      },
      { sequelize, tableName: "referral_reward", timestamps: true, modelName: "referralReward" }
    );
  }

  public static associate(models: any) {
    referralReward.belongsTo(models.referral, { foreignKey: "referralId", as: "referral" });
    referralReward.belongsTo(models.user, { foreignKey: "userId", as: "user" });
  }
}
