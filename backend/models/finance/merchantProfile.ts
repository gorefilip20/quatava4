import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

interface merchantProfileAttributes {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  website?: string;
  apiKey: string;
  secretKey: string;
  callbackUrl?: string;
  acceptedCurrencies: string[];
  totalVolume: number;
  totalTransactions: number;
  status: "ACTIVE" | "PENDING" | "SUSPENDED";
  createdAt?: Date;
  updatedAt?: Date;
}

type merchantProfileCreationAttributes = Sequelize.Optional<
  merchantProfileAttributes,
  "id" | "totalVolume" | "totalTransactions" | "status" | "createdAt" | "updatedAt"
>;

export default class merchantProfile
  extends Model<merchantProfileAttributes, merchantProfileCreationAttributes>
  implements merchantProfileAttributes
{
  id!: string;
  userId!: string;
  businessName!: string;
  businessType!: string;
  website?: string;
  apiKey!: string;
  secretKey!: string;
  callbackUrl?: string;
  acceptedCurrencies!: string[];
  totalVolume!: number;
  totalTransactions!: number;
  status!: "ACTIVE" | "PENDING" | "SUSPENDED";
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof merchantProfile {
    return merchantProfile.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          validate: {
            notNull: { msg: "userId: User ID cannot be null" },
            isUUID: { args: 4, msg: "userId: User ID must be a valid UUID" },
          },
          comment: "ID of the user who owns this merchant profile",
        },
        businessName: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: {
            notEmpty: { msg: "businessName: Business name cannot be empty" },
          },
          comment: "Name of the merchant business",
        },
        businessType: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: {
            notEmpty: { msg: "businessType: Business type cannot be empty" },
          },
          comment: "Type/category of the business",
        },
        website: {
          type: DataTypes.STRING(255),
          allowNull: true,
          validate: {
            isUrl: { msg: "website: Must be a valid URL" },
          },
          comment: "Business website URL",
        },
        apiKey: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
          validate: {
            notEmpty: { msg: "apiKey: API key cannot be empty" },
          },
          comment: "Public API key for merchant integration",
        },
        secretKey: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: {
            notEmpty: { msg: "secretKey: Secret key cannot be empty" },
          },
          comment: "Secret key for merchant integration (keep private)",
        },
        callbackUrl: {
          type: DataTypes.STRING(255),
          allowNull: true,
          validate: {
            isUrl: { msg: "callbackUrl: Must be a valid URL" },
          },
          comment: "Webhook URL for payment notifications",
        },
        acceptedCurrencies: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: [],
          comment: "List of accepted cryptocurrency symbols",
        },
        totalVolume: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
          validate: {
            isFloat: { msg: "totalVolume: Must be a number" },
          },
          comment: "Total payment volume processed",
        },
        totalTransactions: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            isInt: { msg: "totalTransactions: Must be an integer" },
          },
          comment: "Total number of transactions processed",
        },
        status: {
          type: DataTypes.ENUM("ACTIVE", "PENDING", "SUSPENDED"),
          allowNull: false,
          defaultValue: "PENDING",
          validate: {
            isIn: {
              args: [["ACTIVE", "PENDING", "SUSPENDED"]],
              msg: "status: Must be one of ACTIVE, PENDING, SUSPENDED",
            },
          },
          comment: "Current status of the merchant profile",
        },
      },
      {
        sequelize,
        modelName: "merchantProfile",
        tableName: "merchant_profile",
        timestamps: true,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "merchantProfileUserIdKey",
            unique: true,
            using: "BTREE",
            fields: [{ name: "userId" }],
          },
          {
            name: "merchantProfileApiKeyKey",
            unique: true,
            using: "BTREE",
            fields: [{ name: "apiKey" }],
          },
        ],
      }
    );
  }

  public static associate(models: any) {
    merchantProfile.belongsTo(models.user, {
      as: "user",
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    merchantProfile.hasMany(models.merchantTransaction, {
      as: "transactions",
      foreignKey: "merchantId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
}
