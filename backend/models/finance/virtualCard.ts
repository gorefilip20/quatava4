import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

export default class virtualCard extends Model<virtualCardAttributes, virtualCardCreationAttributes> implements virtualCardAttributes {
  id!: string;
  userId!: string;
  currency!: "USD";
  cardholderName!: string;
  last4!: string;
  expiryMonth!: number;
  expiryYear!: number;
  balance!: number;
  status!: "ACTIVE" | "FROZEN" | "CLOSED";
  providerReference?: string;
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof virtualCard {
    return virtualCard.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
        userId: { type: DataTypes.UUID, allowNull: false },
        currency: { type: DataTypes.ENUM("USD"), allowNull: false, defaultValue: "USD" },
        cardholderName: { type: DataTypes.STRING(160), allowNull: false },
        last4: { type: DataTypes.STRING(4), allowNull: false },
        expiryMonth: { type: DataTypes.INTEGER, allowNull: false },
        expiryYear: { type: DataTypes.INTEGER, allowNull: false },
        balance: { type: DataTypes.DECIMAL(24, 8), allowNull: false, defaultValue: 0 },
        status: { type: DataTypes.ENUM("ACTIVE", "FROZEN", "CLOSED"), allowNull: false, defaultValue: "ACTIVE" },
        providerReference: { type: DataTypes.STRING(120), allowNull: true },
      },
      { sequelize, modelName: "virtualCard", tableName: "virtual_card", timestamps: true, indexes: [{ unique: true, fields: ["userId"] }, { fields: ["status"] }] }
    );
  }
  public static associate(models: any) {
    virtualCard.belongsTo(models.user, { as: "user", foreignKey: "userId", onDelete: "CASCADE" });
  }
}
