import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

interface referralAttributes {
  id: string;
  referrerId: string;
  referredId: string;
  status: "PENDING" | "ACTIVE" | "EXPIRED";
  reward: number;
  tier: "BRONZE" | "SILVER" | "GOLD";
  createdAt?: Date;
  updatedAt?: Date;
}

type referralCreationAttributes = Sequelize.Optional<referralAttributes, "id" | "reward" | "tier" | "createdAt" | "updatedAt">;

export default class referral extends Model<referralAttributes, referralCreationAttributes> implements referralAttributes {
  id!: string;
  referrerId!: string;
  referredId!: string;
  status!: "PENDING" | "ACTIVE" | "EXPIRED";
  reward!: number;
  tier!: "BRONZE" | "SILVER" | "GOLD";
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof referral {
    return referral.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
        referrerId: { type: DataTypes.UUID, allowNull: false },
        referredId: { type: DataTypes.UUID, allowNull: false },
        status: { type: DataTypes.ENUM("PENDING", "ACTIVE", "EXPIRED"), allowNull: false, defaultValue: "PENDING" },
        reward: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 },
        tier: { type: DataTypes.ENUM("BRONZE", "SILVER", "GOLD"), allowNull: false, defaultValue: "BRONZE" },
        createdAt: { type: DataTypes.DATE, allowNull: true },
        updatedAt: { type: DataTypes.DATE, allowNull: true },
      },
      { sequelize, tableName: "referral", timestamps: true, modelName: "referral" }
    );
  }

  public static associate(models: any) {
    referral.belongsTo(models.user, { foreignKey: "referrerId", as: "referrer" });
    referral.belongsTo(models.user, { foreignKey: "referredId", as: "referred" });
  }
}
