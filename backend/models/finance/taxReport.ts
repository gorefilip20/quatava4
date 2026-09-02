import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

interface taxReportAttributes {
  id: string;
  userId: string;
  year: number;
  type: "ANNUAL" | "QUARTERLY";
  totalGains: number;
  totalLosses: number;
  netGain: number;
  totalTransactions: number;
  generatedAt: Date;
  status: "GENERATED" | "DOWNLOADED";
  fileUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type taxReportCreationAttributes = Sequelize.Optional<
  taxReportAttributes,
  | "id"
  | "totalGains"
  | "totalLosses"
  | "netGain"
  | "totalTransactions"
  | "status"
  | "createdAt"
  | "updatedAt"
>;

export default class taxReport
  extends Model<taxReportAttributes, taxReportCreationAttributes>
  implements taxReportAttributes
{
  id!: string;
  userId!: string;
  year!: number;
  type!: "ANNUAL" | "QUARTERLY";
  totalGains!: number;
  totalLosses!: number;
  netGain!: number;
  totalTransactions!: number;
  generatedAt!: Date;
  status!: "GENERATED" | "DOWNLOADED";
  fileUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof taxReport {
    return taxReport.init(
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
          comment: "ID of the user this tax report belongs to",
        },
        year: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            isInt: { msg: "year: Year must be an integer" },
            min: { args: [2000], msg: "year: Year must be 2000 or later" },
            max: { args: [2100], msg: "year: Year must be 2100 or earlier" },
          },
          comment: "Tax year this report covers",
        },
        type: {
          type: DataTypes.ENUM("ANNUAL", "QUARTERLY"),
          allowNull: false,
          validate: {
            isIn: {
              args: [["ANNUAL", "QUARTERLY"]],
              msg: "type: Must be one of ANNUAL, QUARTERLY",
            },
          },
          comment: "Type of tax report",
        },
        totalGains: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
          validate: {
            isFloat: { msg: "totalGains: Must be a number" },
          },
          comment: "Total gains for the period",
        },
        totalLosses: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
          validate: {
            isFloat: { msg: "totalLosses: Must be a number" },
          },
          comment: "Total losses for the period",
        },
        netGain: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
          validate: {
            isFloat: { msg: "netGain: Must be a number" },
          },
          comment: "Net gain (totalGains - totalLosses)",
        },
        totalTransactions: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            isInt: { msg: "totalTransactions: Must be an integer" },
          },
          comment: "Total number of taxable transactions",
        },
        generatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          comment: "When the report was generated",
        },
        status: {
          type: DataTypes.ENUM("GENERATED", "DOWNLOADED"),
          allowNull: false,
          defaultValue: "GENERATED",
          validate: {
            isIn: {
              args: [["GENERATED", "DOWNLOADED"]],
              msg: "status: Must be one of GENERATED, DOWNLOADED",
            },
          },
          comment: "Current status of the report",
        },
        fileUrl: {
          type: DataTypes.STRING(500),
          allowNull: true,
          comment: "URL to the generated report file",
        },
      },
      {
        sequelize,
        modelName: "taxReport",
        tableName: "tax_report",
        timestamps: true,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "taxReportUserIdKey",
            using: "BTREE",
            fields: [{ name: "userId" }],
          },
          {
            name: "taxReportUserYearTypeKey",
            unique: true,
            using: "BTREE",
            fields: [{ name: "userId" }, { name: "year" }, { name: "type" }],
          },
        ],
      }
    );
  }

  public static associate(models: any) {
    taxReport.belongsTo(models.user, {
      as: "user",
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
}
