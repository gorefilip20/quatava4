import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

interface billCategoryAttributes {
  id: string;
  name: string;
  icon: string;
  country: string;
  status: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type billCategoryCreationAttributes = Sequelize.Optional<billCategoryAttributes, "id" | "status" | "createdAt" | "updatedAt">;

export default class billCategory extends Model<billCategoryAttributes, billCategoryCreationAttributes> implements billCategoryAttributes {
  id!: string;
  name!: string;
  icon!: string;
  country!: string;
  status!: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof billCategory {
    return billCategory.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
        name: { type: DataTypes.STRING(100), allowNull: false },
        icon: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "zap" },
        country: { type: DataTypes.STRING(5), allowNull: false },
        status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        createdAt: { type: DataTypes.DATE, allowNull: true },
        updatedAt: { type: DataTypes.DATE, allowNull: true },
      },
      { sequelize, tableName: "bill_category", timestamps: true, modelName: "billCategory" }
    );
  }
}
