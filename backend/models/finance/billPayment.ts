import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

interface billPaymentAttributes {
  id: string;
  userId: string;
  categoryId: string;
  billerName: string;
  accountNumber: string;
  amount: number;
  currency: string;
  country: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  reference: string;
  paidAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type billPaymentCreationAttributes = Sequelize.Optional<billPaymentAttributes, "id" | "paidAt" | "createdAt" | "updatedAt">;

export default class billPayment extends Model<billPaymentAttributes, billPaymentCreationAttributes> implements billPaymentAttributes {
  id!: string;
  userId!: string;
  categoryId!: string;
  billerName!: string;
  accountNumber!: string;
  amount!: number;
  currency!: string;
  country!: string;
  status!: "PENDING" | "COMPLETED" | "FAILED";
  reference!: string;
  paidAt!: Date | null;
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof billPayment {
    return billPayment.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
        userId: { type: DataTypes.UUID, allowNull: false },
        categoryId: { type: DataTypes.UUID, allowNull: false },
        billerName: { type: DataTypes.STRING(255), allowNull: false },
        accountNumber: { type: DataTypes.STRING(100), allowNull: false },
        amount: { type: DataTypes.DOUBLE, allowNull: false },
        currency: { type: DataTypes.STRING(20), allowNull: false },
        country: { type: DataTypes.STRING(5), allowNull: false },
        status: { type: DataTypes.ENUM("PENDING", "COMPLETED", "FAILED"), allowNull: false, defaultValue: "PENDING" },
        reference: { type: DataTypes.STRING(100), allowNull: false },
        paidAt: { type: DataTypes.DATE, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: true },
        updatedAt: { type: DataTypes.DATE, allowNull: true },
      },
      { sequelize, tableName: "bill_payment", timestamps: true, modelName: "billPayment" }
    );
  }

  public static associate(models: any) {
    billPayment.belongsTo(models.billCategory, { foreignKey: "categoryId", as: "category" });
    billPayment.belongsTo(models.user, { foreignKey: "userId", as: "user" });
  }
}
