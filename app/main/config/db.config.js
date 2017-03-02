/**
 * Created by shalitha on 17/5/16.
 */


var tableNames = {
  keyboard: {
    layouts: 'KeyboardLayouts',
    pages: 'KeyboardPages',
    pageInfo: 'KeyboardPageInfo',
    keys: 'KayboardKeyInfo',
    functions: 'Functions'
  },
  auth: {
    staff: "Staff",
    shifts: "Shifts",
    shiftStatus: "ShiftStatus"
  },
  item: {
    item: 'Item',
    subPLU1: 'SubPLU1',
    subPLU2: 'SubPLU2',
    subPLU3: 'SubPLU3',
    priceGroups: 'PriceGroups',
    modifiers: 'ModifiersKeyInfo',
    departments: 'Departments'
  },
  locations: {
    locations: 'Locations'
  },
  bill: {
    tempDetail: 'TempBillDetail',
    tempHeader: 'TempBillHeader',
    tempPayTrans: 'TempPayTrans',
    detail: 'BillDetail',
    header: 'BillHeader',
    tenderTypes: 'TenderTypes',
    stockTransactions: 'StockTransactions',
    payTransactions: 'PayTrans',
    payTransactionsOverTender: 'PayTransOverTender',
    voidItems: 'VoidItems'
  },
  salesKit: {
    salesKitApplicablePeriod: 'SalesKitApplicablePeriod',
    salesKitByDays: 'SalesKitByDays',
    salesKitItems: 'SalesKitItems',
    salesKitSelections: 'SalesKitSelections'
  },
  promo: {
    days: 'PromotionDays'
  },
  discounts: {
    tempBillDiscounts: 'TempBillDiscounts',
    billDiscounts: 'BillDiscounts',
    discountsFor: 'DiscountFor',
    discounts: 'Discounts'
  },
  refunds: {
    reasons: 'Reason'
  },
  config: {
    printerSettings: 'PrinterSettings',
    machines: 'MachinesDetails',
  },
  pwp:{
    pwp: "Pwp",
    itemsByPwp: "ItemsByPwp"
  }
};

angular.module('itouch.config')

  /**
   * This contains DB table configuration. This is used by app/common/db.service.js
   */
  .constant('DB_CONFIG', {
      tableNames: tableNames,
      name: 'ITouchLite',
      tables: [
        {
          name: tableNames.auth.staff, //table name
          columns: [                      //column config
            {name: 'Id', type: 'integer'},
            {name: 'Code', type: 'text'},
            {name: 'PersonalId', type: 'text'},
            {name: 'IdType', type: 'integer'},
            {name: 'DescLevel', type: 'integer'},
            {name: 'Orientation', type: 'char(1)'},
            {name: 'SecurityLevel', type: 'smallint'},
            {name: 'LastName', type: 'text'},
            {name: 'GivenName', type: 'text'},
            {name: 'MiddleName', type: 'text'},
            {name: 'Password', type: 'text'},
            {name: 'BirthDay', type: 'date'},
            {name: 'BlockNumber', type: 'text'},
            {name: 'StreetName', type: 'text'},
            {name: 'BuildingName', type: 'text'},
            {name: 'City', type: 'text'},
            {name: 'State', type: 'text'},
            {name: 'PostalCode', type: 'text'},
            {name: 'CountryCode', type: 'text'},
            {name: 'HomeTelephone', type: 'text'},
            {name: 'OfficeTelephone', type: 'text'},
            {name: 'MobileNumber', type: 'text'},
            {name: 'HomeFax', type: 'text'},
            {name: 'OfficeFax', type: 'text'},
            {name: 'Email', type: 'text'},
            {name: 'DayLimit', type: 'text'},
            {name: 'MonthLimit', type: 'text'},
            {name: 'YearLimit', type: 'text'},
            {name: 'DescriptionLevel', type: 'integer'},
            {name: 'Position', type: 'text'},
            {name: 'Pager', type: 'text'}
          ]
        },
        {
          name: tableNames.keyboard.layouts,
          columns: [
            {name: 'Id', type: 'integer'},
            {name: 'LayoutId', type: 'integer'},
            {name: 'MachineId', type: 'integer'}
          ]
        },
        {
          name: tableNames.keyboard.pages,
          columns: [
            {name: 'Id', type: 'INT'},
            {name: 'Code', type: 'text'},
            {name: 'Description1', type: 'text'},
            {name: 'Description2', type: 'text'},
            {name: 'Image', type: 'text'},
            {name: 'KeyboardLayoutMasterId', type: 'integer'}
          ]
        },
        {
          name: tableNames.keyboard.pageInfo,
          columns: [
            {name: 'Id', type: 'INT'},
            {name: 'Code', type: 'text'},
            {name: 'Colour', type: 'text'},
            {name: 'PageDesc11', type: 'text'},
            {name: 'PageDesc12', type: 'text'},
            {name: 'PageDesc13', type: 'text'},
            {name: 'PageDesc21', type: 'text'},
            {name: 'PageDesc22', type: 'text'},
            {name: 'PageDesc23', type: 'text'},
            {name: 'KeyboardLayoutId', type: 'integer'},
            {name: 'KeyboardPageId', type: 'integer'},
            {name: 'KeyNo', type: 'integer'},
            {name: 'ImageName', type: 'text'}
          ]
        },
        {
          name: tableNames.keyboard.keys,
          columns: [
            {name: 'Id', type: 'INT'},
            {name: 'Color', type: 'text'},
            {name: 'KeyDesc11', type: 'text'},
            {name: 'KeyDesc12', type: 'text'},
            {name: 'KeyDesc13', type: 'text'},
            {name: 'KeyDesc21', type: 'text'},
            {name: 'KeyDesc22', type: 'text'},
            {name: 'KeyDesc23', type: 'text'},
            {name: 'ImageName', type: 'text'},
            {name: 'KeyNo', type: 'integer'},
            {name: 'KeyboardLayoutId', type: 'integer'},
            {name: 'KeyboardPageId', type: 'integer'},
            {name: 'PageKeyNo', type: 'integer'},
            {name: 'PLU', type: 'text'},
            {name: 'SubPLU1Code', type: 'text'},
            {name: 'SubPLU2Code', type: 'text'},
            {name: 'SubPLU3Code', type: 'text'},
            {name: 'ValidFrom', type: 'date'},
            {name: 'ValidTo', type: 'date'}
          ]
        },
        {
          name: tableNames.item.item,
          columns: [
            {name: 'Id', type: 'integer'},
            {name: 'Plu', type: 'text'},
            {name: 'PLU_Description1', type: 'text'},
            {name: 'PLU_Description2', type: 'text'},
            {name: 'Description1', type: 'text'},
            {name: 'Description2', type: 'text'},
            {name: 'KitchenId', type: 'text'},
            {name: 'PriceGroupId', type: 'text'},
            {name: 'SubPlu1Id', type: 'integer'},
            {name: 'SubPlu2Id', type: 'integer'},
            {name: 'SubPlu3Id', type: 'integer'},
            {name: 'DepartmentId', type: 'integer'},
            {name: 'UOM_Id', type: 'integer'},
            {name: 'ZeroPrice', type: 'BOOLEAN'},
            {name: 'AutoBundle', type: 'BOOLEAN'},
            {name: 'BelowCost', type: 'BOOLEAN'},
            {name: 'PluType', type: 'text'},
            {name: 'Taxable', type: 'BOOLEAN'},
            {name: 'HouseBarCode', type: 'text'},
            {name: 'MultiDiscount', type: 'BOOLEAN'},
            {name: 'NoDiscount', type: 'BOOLEAN'},
            {name: 'PopUpRemark', type: 'BIT'}
          ]
        },
        {
          name: tableNames.item.subPLU1,
          columns: [
            {name: 'Id', type: 'integer'},
            {name: 'Code', type: 'text'},
            {name: 'EntityId', type: 'integer'},
            {name: 'Description1', type: 'text'},
            {name: 'Description2', type: 'text'}
          ]
        },
        {
          name: tableNames.item.subPLU2,
          columns: [
            {name: 'Id', type: 'integer'},
            {name: 'Code', type: 'text'},
            {name: 'EntityId', type: 'integer'},
            {name: 'Description1', type: 'text'},
            {name: 'Description2', type: 'text'}
          ]
        },
        {
          name: tableNames.item.subPLU3,
          columns: [
            {name: 'Id', type: 'integer'},
            {name: 'Code', type: 'text'},
            {name: 'EntityId', type: 'integer'},
            {name: 'Description1', type: 'text'},
            {name: 'Description2', type: 'text'}
          ]
        },
        {
          name: tableNames.item.priceGroups,
          columns: [
            {name: 'Id', type: 'integer'},
            {name: 'Plu', type: 'text'},
            {name: 'Price', type: 'double'},
            {name: 'PriceGroupId', type: 'integer'},
            {name: 'PriceLevelId', type: 'integer'},
            {name: 'Remarks', type: 'text'},
            {name: 'StdCost', type: 'double'}
          ]
        },
        {
          name: tableNames.item.modifiers,
          columns: [
            {name: 'Id', type: 'integer'},
            {name: 'PLU', type: 'text'},
            {name: 'KeyNo', type: 'integer'},
            {name: 'PageNo', type: 'integer'}
          ]
        },
        {
          name: tableNames.item.departments,
          columns: [
            {name: 'Id', type: 'integer'},
            {name: 'Code', type: 'text'},
            {name: 'Description1', type: 'text'},
            {name: 'Description2', type: 'text'},
            {name: 'GroupId', type: 'integer'},
            {name: 'CostingMethodId', type: 'integer'},
            {name: 'Modifier', type: 'integer'},
            {name: 'ModifierType', type: 'text'}
          ]
        },
        {
          name: tableNames.locations.locations,
          columns: [
            {name: 'Id', type: 'integer'},
            {name: 'Code', type: 'text'},
            {name: 'Address1', type: 'text'},
            {name: 'Address2', type: 'text'},
            {name: 'Country', type: 'text'},
            {name: 'Description1', type: 'text'},
            {name: 'Description2', type: 'text'},
            {name: 'ShortName', type: 'text'},
            {name: 'EntityId', type: 'integer'},
            {name: 'LandSize', type: 'integer'},
            {name: 'PostalCode', type: 'text'},
            {name: 'UOM', type: 'text'},
            {name: 'PriceLevel', type: 'integer'},
            {name: 'Tax1DepApplicable', type: 'boolean'},
            {name: 'Tax1Desc1', type: 'text'},
            {name: 'Tax1Desc2', type: 'text'},
            {name: 'Tax1Option', type: 'integer'},
            {name: 'Tax1Perc', type: 'double'},
            {name: 'Tax2DepApplicable', type: 'boolean'},
            {name: 'Tax2Desc1', type: 'text'},
            {name: 'Tax2Desc2', type: 'text'},
            {name: 'Tax2Option', type: 'integer'},
            {name: 'Tax2Perc', type: 'double'},
            {name: 'Tax3DepApplicable', type: 'boolean'},
            {name: 'Tax3Desc1', type: 'text'},
            {name: 'Tax3Desc2', type: 'text'},
            {name: 'Tax3Option', type: 'integer'},
            {name: 'Tax3Perc', type: 'double'},
            {name: 'Tax4DepApplicable', type: 'boolean'},
            {name: 'Tax4Desc1', type: 'text'},
            {name: 'Tax4Desc2', type: 'text'},
            {name: 'Tax4Option', type: 'integer'},
            {name: 'Tax4Perc', type: 'double'},
            {name: 'Tax5DepApplicable', type: 'boolean'},
            {name: 'Tax5Desc1', type: 'text'},
            {name: 'Tax5Desc2', type: 'text'},
            {name: 'Tax5Option', type: 'integer'},
            {name: 'Tax5Perc', type: 'double'}
          ]
        },
      //  temp bill details
        {
          name: tableNames.bill.tempDetail,
          columns: [
            { name: "BusinessDate", type: "date" },
            { name: "LocationId", type: "int NOT NULL" },
            { name: "MachineId", type: "int NOT NULL" },
            { name: "DocNo", type: "text NOT NULL" },
            { name: "PluType", type: "int NOT NULL" },
            { name: "KitType", type: "int NOT NULL" },
            { name: "ItemId", type: "int NOT NULL" },
            { name: "LineNumber", type: "int NOT NULL" },
            { name: "SuspendDepDocNo", type: "text NOT NULL" },
            { name: "OrderedDateTime", type: "datetime NULL" },
            { name: "OrderedBy", type: "text NOT NULL" },
            { name: "SpecialOrderRemark", type: "text NULL" },
            { name: "ServingTime", type: "datetime NULL" },
            { name: "TakeAway", type: "int NOT NULL" },
            { name: "ItemType", type: "text NOT NULL" },
            { name: "ParentItemLineNumber", type: "int NOT NULL" },
            { name: "PromoPwpId", type: "int NOT NULL" },
            { name: "PriceLevelId", type: "int NOT NULL" },
            { name: "StdCost", type: "double NOT NULL" },
            { name: "OrgPrice", type: "double NOT NULL" },
            { name: "AlteredPrice", type: "double NOT NULL" },
            { name: "WaCost", type: "double NOT NULL" },
            { name: "Price", type: "double NOT NULL" },
            { name: "Qty", type: "double NOT NULL" },
            { name: "SubTotal", type: "double NOT NULL" },
            { name: "DiscAmount", type: "double NOT NULL" },
            { name: "Tax1DiscAmount", type: "double NOT NULL" },
            { name: "Tax2DiscAmount", type: "double NOT NULL" },
            { name: "Tax3DiscAmount", type: "double NOT NULL" },
            { name: "Tax4DiscAmount", type: "double NOT NULL" },
            { name: "Tax5DiscAmount", type: "double NOT NULL" },
            { name: "Tax1Amount", type: "double NOT NULL" },
            { name: "Tax2Amount", type: "double NOT NULL" },
            { name: "Tax3Amount", type: "double NOT NULL" },
            { name: "Tax4Amount", type: "double NOT NULL" },
            { name: "Tax5Amount", type: "double NOT NULL" },
            { name: "DepAmount", type: "double NOT NULL" },
            { name: "Tax1Option", type: "int NOT NULL" },
            { name: "Tax2Option", type: "int NOT NULL" },
            { name: "Tax3Option", type: "int NOT NULL" },
            { name: "Tax4Option", type: "int NOT NULL" },
            { name: "Tax5Option", type: "int NOT NULL" },
            { name: "Tax1Perc", type: "double NOT NULL" },
            { name: "Tax2Perc", type: "double NOT NULL" },
            { name: "Tax3Perc", type: "double NOT NULL" },
            { name: "Tax4Perc", type: "double NOT NULL" },
            { name: "Tax5Perc", type: "double NOT NULL" },
            { name: "ByAmount", type: "int NOT NULL" },
            { name: "NoDiscount", type: "int NOT NULL" },
            { name: "MultiDiscount", type: "int NOT NULL" },
            { name: "PriceChanged", type: "int NOT NULL" },
            { name: "Taxable", type: "int NOT NULL" },
            { name: "BelowCost", type: "int NOT NULL" },
            { name: "CurCode", type: "text NULL" },
            { name: "BuyRate", type: "double NULL" },
            { name: "ReasonId", type: "text NULL" },
            { name: "RefCode", type: "text NULL" },
            { name: "Remark", type: "text NULL" },
            { name: "Comm", type: "double NOT NULL" },
            { name: "Desc1", type: "text NULL" },
            { name: "Desc2", type: "text NULL" },
            { name: "Selectable", type: "BOOLEAN NULL" }
          ],
          primaryKey: "BusinessDate, LocationId, MachineId, DocNo, ItemId, LineNumber"
        },
        {
          name: tableNames.bill.tempHeader,
          columns: [
            { name: "BusinessDate", type: "date" },
            { name: "LocationId", type: "int NOT NULL" },
            { name: "MachineId", type: "int NOT NULL" },
            { name: "DocNo", type: "text NOT NULL" },
            { name: "DocType", type: "text NOT NULL" },
            { name: "SysDateTime", type: "int NOT NULL" },
            { name: "VoidDocNo", type: "text NULL" },
            { name: "TableId", type: "int NOT NULL" },
            { name: "Pax", type: "text NOT NULL" },
            { name: "ShiftId", type: "int NULL" },
            { name: "VipId", type: "int NOT NULL" },
            { name: "CashierId", type: "int NULL" },
            { name: "StaffId", type: "int NULL" },
            { name: "AuthBy", type: "int NOT NULL" },
            { name: "SubTotal", type: "double NOT NULL" },
            { name: "DepAmount", type: "double NOT NULL" },
            { name: "Tax1DiscAmount", type: "double NOT NULL" },
            { name: "Tax2DiscAmount", type: "double NOT NULL" },
            { name: "Tax3DiscAmount", type: "double NOT NULL" },
            { name: "Tax4DiscAmount", type: "double NOT NULL" },
            { name: "Tax5DiscAmount", type: "double NOT NULL" },
            { name: "DiscAmount", type: "double NOT NULL" },
            { name: "Tax1Option", type: "int NOT NULL" },
            { name: "Tax1Perc", type: "double NOT NULL" },
            { name: "Tax1Amount", type: "double NOT NULL" },
            { name: "Tax2Amount", type: "double NOT NULL" },
            { name: "Tax2Option", type: "int NOT NULL" },
            { name: "Tax2Perc", type: "double NOT NULL" },
            { name: "Tax3Amount", type: "double NOT NULL" },
            { name: "Tax3Option", type: "int NOT NULL" },
            { name: "Tax3Perc", type: "double NOT NULL" },
            { name: "Tax4Amount", type: "double NOT NULL" },
            { name: "Tax4Option", type: "int NOT NULL" },
            { name: "Tax4Perc", type: "double NOT NULL" },
            { name: "Tax5Amount", type: "double NOT NULL" },
            { name: "Tax5Option", type: "int NOT NULL" },
            { name: "Tax5Perc", type: "double NOT NULL" },
            { name: "ReprintCount", type: "double NOT NULL" },
            { name: "Remarks", type: "text NOT NULL" },
            { name: "OrderTag", type: "text NOT NULL" },
            { name: "IsClosed", type: "boolean boolean NULL" }
          ],
          primaryKey: "BusinessDate, LocationId, MachineId, DocNo"
        },
        {
          name: tableNames.bill.tempPayTrans,
          columns: [
            { name: "BusinessDate", type: "DATE" },
            { name: "LocationId", type: "INT NOT NULL" },
            { name: "MachineId", type: "int NOT NULL" },
            { name: "DocNo", type: "TEXT NOT NULL" },
            { name: "Cash", type: "BOOLEAN" },
            { name: "SeqNo", type: "INT NOT NULL" },
            { name: "PayTypeId", type: "INT NOT NULL" },
            { name: "Amount", type: "DOUBLE" },
            { name: "ChangeAmount", type: "DOUBLE" },
            { name: "ConvRate", type: "DOUBLE" },
            { name: "CurrencyId", type: "INT" },
            { name: "Remarks", type: "TEXT" },
            { name: "IsExported", type: "BOOLEAN NOT NULL" }
          ],
          primaryKey: "BusinessDate, LocationId, MachineId, DocNo, PayTypeId, SeqNo"
        },
        {
          name: tableNames.bill.tenderTypes,
          columns: [
            {name: 'Id', type: 'integer'},
            {name: 'Code', type: 'text'},
            {name: 'Color', type: 'text'},
            {name: 'Cash', type: 'integer'},
            {name: 'Description1', type: 'text'},
            {name: 'Description2', type: 'text'},
            {name: 'DiscountId', type: 'integer'},
            {name: 'Image', type: 'text'},
            {name: 'OpenDrawer', type: 'integer'},
            {name: 'OverTender', type: 'integer'},
            {name: 'OverTenderTypeId', type: 'integer'},
            {name: 'Round', type: 'integer'},
            {name: 'TenderAmount', type: 'double'},
            {name: 'TenderPrompt', type: 'integer'},
            {name: 'TenderRemarks', type: 'integer'},
            {name: 'TenderTypeId', type: 'integer'},
            {name: 'TotalPrintReceipt', type: 'text'},
            {name: 'PayOrder', type: 'integer'}
          ]
        },
        {
          name: tableNames.bill.detail,
          columns: [
            { name: "BusinessDate", type: "date" },
            { name: "LocationId", type: "int NOT NULL" },
            { name: "MachineId", type: "int NOT NULL" },
            { name: "DocNo", type: "text NOT NULL" },
            { name: "PluType", type: "int NOT NULL" },
            { name: "KitType", type: "int NOT NULL" },
            { name: "ItemId", type: "int NOT NULL" },
            { name: "LineNumber", type: "int NOT NULL" },
            { name: "SuspendDepDocNo", type: "text NOT NULL" },
            { name: "OrderedDateTime", type: "datetime NULL" },
            { name: "OrderedBy", type: "text NOT NULL" },
            { name: "SpecialOrderRemark", type: "text NULL" },
            { name: "ServingTime", type: "datetime NULL" },
            { name: "TakeAway", type: "int NOT NULL" },
            { name: "ItemType", type: "text NOT NULL" },
            { name: "ParentItemLineNumber", type: "int NOT NULL" },
            { name: "PromoPwpId", type: "int NOT NULL" },
            { name: "PriceLevelId", type: "int NOT NULL" },
            { name: "StdCost", type: "double NOT NULL" },
            { name: "OrgPrice", type: "double NOT NULL" },
            { name: "AlteredPrice", type: "double NOT NULL" },
            { name: "WaCost", type: "double NOT NULL" },
            { name: "Price", type: "double NOT NULL" },
            { name: "Qty", type: "double NOT NULL" },
            { name: "SubTotal", type: "double NOT NULL" },
            { name: "DiscAmount", type: "double NOT NULL" },
            { name: "Tax1DiscAmount", type: "double NOT NULL" },
            { name: "Tax2DiscAmount", type: "double NOT NULL" },
            { name: "Tax3DiscAmount", type: "double NOT NULL" },
            { name: "Tax4DiscAmount", type: "double NOT NULL" },
            { name: "Tax5DiscAmount", type: "double NOT NULL" },
            { name: "DepAmount", type: "double NOT NULL" },
            { name: "Tax1Option", type: "int NOT NULL" },
            { name: "Tax2Option", type: "int NOT NULL" },
            { name: "Tax3Option", type: "int NOT NULL" },
            { name: "Tax4Option", type: "int NOT NULL" },
            { name: "Tax5Option", type: "int NOT NULL" },
            { name: "Tax1Perc", type: "double NOT NULL" },
            { name: "Tax2Perc", type: "double NOT NULL" },
            { name: "Tax3Perc", type: "double NOT NULL" },
            { name: "Tax4Perc", type: "double NOT NULL" },
            { name: "Tax5Perc", type: "double NOT NULL" },
            { name: "Tax1Amount", type: "double NOT NULL" },
            { name: "Tax2Amount", type: "double NOT NULL" },
            { name: "Tax3Amount", type: "double NOT NULL" },
            { name: "Tax4Amount", type: "double NOT NULL" },
            { name: "Tax5Amount", type: "double NOT NULL" },
            { name: "ByAmount", type: "int NOT NULL" },
            { name: "NoDiscount", type: "int NOT NULL" },
            { name: "MultiDiscount", type: "int NOT NULL" },
            { name: "PriceChanged", type: "int NOT NULL" },
            { name: "Taxable", type: "int NOT NULL" },
            { name: "BelowCost", type: "int NOT NULL" },
            { name: "CurCode", type: "text NULL" },
            { name: "BuyRate", type: "double NULL" },
            { name: "ReasonId", type: "text NULL" },
            { name: "RefCode", type: "text NULL" },
            { name: "Remark", type: "text NULL" },
            { name: "Comm", type: "double NOT NULL" },
            { name: "Desc1", type: "text NULL" },
            { name: "Desc2", type: "text NULL" },
            { name: "IsExported", type: "int NULL" }
          ],
          primaryKey: "BusinessDate, LocationId, MachineId, DocNo, ItemId, LineNumber"
        },
        {
          name: tableNames.bill.header,
          columns: [
            { name: "BusinessDate", type: "date" },
            { name: "LocationId", type: "int NOT NULL" },
            { name: "MachineId", type: "int NOT NULL" },
            { name: "DocNo", type: "text NOT NULL" },
            { name: "DocType", type: "text NOT NULL" },
            { name: "SysDateTime", type: "int NOT NULL" },
            { name: "VoidDocNo", type: "text NULL" },
            { name: "TableId", type: "int NOT NULL" },
            { name: "Pax", type: "text NOT NULL" },
            { name: "ShiftId", type: "int NULL" },
            { name: "VipId", type: "int NOT NULL" },
            { name: "CashierId", type: "int NULL" },
            { name: "StaffId", type: "int NULL" },
            { name: "AuthBy", type: "int NOT NULL" },
            { name: "SubTotal", type: "double NOT NULL" },
            { name: "DepAmount", type: "double NOT NULL" },
            { name: "Tax1DiscAmount", type: "double NOT NULL" },
            { name: "Tax2DiscAmount", type: "double NOT NULL" },
            { name: "Tax3DiscAmount", type: "double NOT NULL" },
            { name: "Tax4DiscAmount", type: "double NOT NULL" },
            { name: "Tax5DiscAmount", type: "double NOT NULL" },
            { name: "DiscAmount", type: "double NOT NULL" },
            { name: "Tax1Option", type: "int NOT NULL" },
            { name: "Tax1Perc", type: "double NOT NULL" },
            { name: "Tax1Amount", type: "double NOT NULL" },
            { name: "Tax2Amount", type: "double NOT NULL" },
            { name: "Tax2Option", type: "int NOT NULL" },
            { name: "Tax2Perc", type: "double NOT NULL" },
            { name: "Tax3Amount", type: "double NOT NULL" },
            { name: "Tax3Option", type: "int NOT NULL" },
            { name: "Tax3Perc", type: "double NOT NULL" },
            { name: "Tax4Amount", type: "double NOT NULL" },
            { name: "Tax4Option", type: "int NOT NULL" },
            { name: "Tax4Perc", type: "double NOT NULL" },
            { name: "Tax5Amount", type: "double NOT NULL" },
            { name: "Tax5Option", type: "int NOT NULL" },
            { name: "Tax5Perc", type: "double NOT NULL" },
            { name: "ReprintCount", type: "double NOT NULL" },
            { name: "Remarks", type: "text NOT NULL" },
            { name: "OrderTag", type: "text NOT NULL" },
            { name: "IsExported", type: "boolean NOT NULL" },
            { name: "IsClosed", type: "boolean boolean NULL" }
          ],
          primaryKey: "BusinessDate, LocationId, MachineId, DocNo"
        },
        {
          name: tableNames.bill.stockTransactions,
          columns: [
            { name: "BusinessDate", type: "date" },
            { name: "LocationId", type: "int NOT NULL" },
            { name: "LineNumber", type: "int NOT NULL" },
            { name: "DocNo", type: "text NOT NULL" },
            { name: "ItemId", type: "int NOT NULL" },
            { name: "SeqNo", type: "int NOT NULL" },
            { name: "DocType", type: "text NOT NULL" },
            { name: "Qty", type: "int NOT NULL" },
            { name: "StdCost", type: "double NOT NULL" },
            { name: "BaseUOMId", type: "int NULL" },
            { name: "IsExported", type: "boolean NOT NULL" }
          ],
          primaryKey: "BusinessDate, LocationId, LineNumber, DocNo, ItemId, SeqNo"
        },
        {
          name: tableNames.bill.payTransactions,
          columns: [
            { name: "BusinessDate", type: "DATE" },
            { name: "LocationId", type: "INT NOT NULL" },
            { name: "MachineId", type: "int NOT NULL" },
            { name: "DocNo", type: "TEXT NOT NULL" },
            { name: "Cash", type: "BOOLEAN" },
            { name: "SeqNo", type: "INT NOT NULL" },
            { name: "PayTypeId", type: "INT NOT NULL" },
            { name: "Amount", type: "DOUBLE" },
            { name: "ChangeAmount", type: "DOUBLE" },
            { name: "ConvRate", type: "DOUBLE" },
            { name: "CurrencyId", type: "INT" },
            { name: "Remarks", type: "TEXT" },
            { name: "IsExported", type: "BOOLEAN NOT NULL" }
          ],
          primaryKey: "BusinessDate, LocationId, MachineId, DocNo, PayTypeId, SeqNo"
        },
        {
          name: tableNames.bill.payTransactionsOverTender,
          columns: [
            { name: "BusinessDate", type: "DATE" },
            { name: "LocationId", type: "INT NOT NULL" },
            { name: "MachineId", type: "int NOT NULL" },
            { name: "DocNo", type: "TEXT NOT NULL" },
            { name: "SeqNo", type: "INT NOT NULL" },
            { name: "PayTypeId", type: "INT NOT NULL" },
            { name: "OverTenderTypeId", type: "INT NOT NULL" },
            { name: "Amount", type: "DOUBLE" },
            { name: "ChangeAmount", type: "DOUBLE" },
            { name: "IsExported", type: "BOOLEAN NOT NULL" }
          ],
          primaryKey: "BusinessDate, LocationId, MachineId, DocNo, PayTypeId, SeqNo, OverTenderTypeId"
        },
        {
          name: tableNames.auth.shifts,
          columns: [
            { name: "Id", type: "INT PRIMARY KEY" },
            { name: "Code", type: "TEXT NOT NULL" },
            { name: "LocationId", type: "INT NOT NULL" },
            { name: "Description1", type: "TEXT NOT NULL" },
            { name: "Description2", type: "TEXT NOT NULL" },
            { name: "StartTime", type: "TIME NOT NULL" },
            { name: "EndTime", type: "TIME NOT NULL" },
            { name: "RA", type: "DOUBLE NOT NULL" },
            { name: "RANoAdj", type: "text NOT NULL" }
          ]
        },
        // {
        //   name: tableNames.keyboard.functions,
        //   columns: [
        //     { name: "Code", type: "INT NOT NULL PRIMARY KEY" },
        //     { name: "Description1", type: "TEXT" },
        //     { name: "Description2", type: "TEXT" },
        //     { name: "Name", type: "TEXT NOT NULL" },
        //     { name: "Inactive", type: "BOOLEAN" },
        //     { name: "Transact", type: "BOOLEAN" },
        //     { name: "Type", type: "TEXT" },
        //     { name: "AccessLevel", type: "INT" },
        //     { name: "DisplayOnTop", type: "BOOLEAN" }
        //   ]
        // },
        {
          name: tableNames.salesKit.salesKitApplicablePeriod,
          columns: [
            { name: "Id", type: "INT NOT NULL PRIMARY KEY" },
            { name: "SalesKitItemsId", type: "INT NOT NULL" },
            { name: "Fromtime", type: "TIME" },
            { name: "ToTime", type: "TIME" },
            { name: "FromDate", type: "DATE" },
            { name: "Todate", type: "DATE" },
            { name: "Status", type: "INT" }
          ]
        },
        {
          name: tableNames.salesKit.salesKitByDays,
          columns: [
            { name: "Id", type: "INT NOT NULL PRIMARY KEY" },
            { name: "SalesKitItemsId", type: "INT NOT NULL" },
            { name: "SalesKitDaysId", type: "INT NOT NULL" }
          ]
        },
        {
          name: tableNames.salesKit.salesKitItems,
          columns: [
            { name: "Id", type: "INT NOT NULL PRIMARY KEY" },
            { name: "SalesKitId", type: "INT NOT NULL" },
            { name: "ItemId", type: "INT NOT NULL" },
            { name: "Quantity", type: "DOUBLE" },
            { name: "Priority", type: "INT NOT NULL" }
          ]
        },
        {
          name: tableNames.salesKit.salesKitSelections,
          columns: [
            { name: "Id", type: "INT NOT NULL PRIMARY KEY" },
            { name: "SalesKitItemsId", type: "INT NOT NULL" },
            { name: "SelectionId", type: "INT NOT NULL" },
            { name: "Quantity", type: "DOUBLE" },
            { name: "AdditionalPrice", type: "DOUBLE NOT NULL" },
            { name: "AdditionalCost", type: "DOUBLE NOT NULL" },
            { name: "Sequence", type: "INT NOT NULL" }
          ]
        },
        {
          name: tableNames.promo.days,
          columns: [
            { name: "Id", type: "INT NOT NULL PRIMARY KEY" },
            { name: "Code", type: "TEXT NOT NULL" },
            { name: "Description", type: "TEXT" }
          ]
        },
        {
          name: tableNames.auth.shiftStatus,
          columns: [
            { name: "Id", type: "INTEGER PRIMARY KEY" },
            { name: "ShiftName", type: "TEXT NOT NULL" },
            { name: "OpenDateTime", type: "DATETIME" },
            { name: "OpenUser", type: "TEXT" },
            { name: "CloseDateTime", type: "DATETIME" },
            { name: "CloseUser", type: "TEXT" },
            { name: "RA", type: "DOUBLE" },
            { name: "RANoAdj", type: "BOOLEAN" },
            { name: "DeclareCashLater", type: "BOOLEAN" }
          ]
        },
        {
          name: tableNames.discounts.discounts,
          columns: [
            { name: "Id", type: "INT" },
            { name: "Code", type: "TEXT NOT NULL" },
            { name: "DiscountFor", type: "INT" },
            { name: "DiscountType", type: "INT" },
            { name: "Amount", type: "DOUBLE" },
            { name: "Percentage", type: "FLOAT" },
            { name: "MaxDiscountedValue", type: "DOUBLE" },
            { name: "MinBillAmount", type: "DOUBLE" },
            { name: "MultiDiscount", type: "BOOLEAN" },
            { name: "FrontendDiscountHidden", type: "BOOLEAN" },
            { name: "Description1", type: "TEXT NOT NULL" },
            { name: "Description2", type: "TEXT" },
          ]
        },
        {
          name: tableNames.discounts.discountsFor,
          columns: [
            { name: "Id", type: "INT NOT NULL PRIMARY KEY" },
            { name: "Code", type: "TEXT NOT NULL" },
            { name: "Description", type: "TEXT NOT NULL" }
          ]
        },
        {
          name: tableNames.discounts.billDiscounts,
          columns: [
            { name: "BusinessDate", type: "DATE NOT NULL" },
            { name: "LocationId", type: "INT NOT NULL" },
            { name: "MachineId", type: "INT NOT NULL" },
            { name: "DocNo", type: "TEXT NOT NULL" },
            { name: "ItemId", type: "INT NOT NULL" },
            { name: "LineNumber", type: "INT NOT NULL" },
            { name: "SeqNo", type: "INT NOT NULL" },
            { name: "DiscountFrom", type: "CHAR" },
            { name: "DiscountId", type: "INT" },
            { name: "DiscountCode", type: "TEXT" },
            { name: "DiscountFor", type: "INT" },
            { name: "DiscountType", type: "CHAR" },
            { name: "DiscountAmount", type: "DOUBLE" },
            { name: "DiscountPercentage", type: "DOUBLE" },
            { name: "IsExported", type: "BOOLEAN" }
          ],
          primaryKey: 'BusinessDate, LocationId, MachineId, DocNo, ItemId, LineNumber, SeqNo'
        },
        {
          name: tableNames.discounts.tempBillDiscounts,
          columns: [
            { name: "BusinessDate", type: "DATE NOT NULL" },
            { name: "LocationId", type: "INT NOT NULL" },
            { name: "MachineId", type: "INT NOT NULL" },
            { name: "DocNo", type: "TEXT NOT NULL" },
            { name: "ItemId", type: "INT NOT NULL" },
            { name: "LineNumber", type: "INT NOT NULL" },
            { name: "SeqNo", type: "INT NOT NULL" },
            { name: "DiscountFrom", type: "CHAR" },
            { name: "DiscountId", type: "INT" },
            { name: "DiscountCode", type: "TEXT" },
            { name: "DiscountFor", type: "INT" },
            { name: "DiscountType", type: "CHAR" },
            { name: "DiscountAmount", type: "DOUBLE" },
            { name: "DiscountPercentage", type: "DOUBLE" }
          ],
          primaryKey: 'BusinessDate, LocationId, MachineId, DocNo, ItemId, LineNumber, SeqNo'
        },
        {
          name: tableNames.bill.voidItems,
          columns: [
            { name: "BusinessDate", type: "date" },
            { name: "LocationId", type: "int NOT NULL" },
            { name: "MachineId", type: "int NOT NULL" },
            { name: "DocNo", type: "text NOT NULL" },
            { name: "SysDateTime", type: "DATETIME NOT NULL" },
            { name: "ItemId", type: "int NOT NULL" },
            { name: "LineNumber", type: "int NOT NULL" },
            { name: "ItemType", type: "text NOT NULL" },
            { name: "ParentItemId", type: "int NOT NULL" },
            { name: "ShiftId", type: "int NOT NULL" },
            { name: "CashierId", type: "int NOT NULL" },
            { name: "StaffId", type: "int NOT NULL" },
            { name: "OrgPrice", type: "double NOT NULL" },
            { name: "AlteredPrice", type: "double NOT NULL" },
            { name: "Price", type: "double NOT NULL" },
            { name: "Qty", type: "double NOT NULL" },
            { name: "SubTotal", type: "double NOT NULL" },
            { name: "DiscAmount", type: "double NOT NULL" },
            { name: "IsExported", type: "boolean NOT NULL" },
            { name: "SeqNo", type: "int NOT NULL" },
          ],
          primaryKey: "BusinessDate, LocationId, MachineId, DocNo, ItemId, LineNumber, SeqNo"
        },
        {
          name: tableNames.refunds.reasons,
          columns: [
            { name: "Id", type: "INT NOT NULL PRIMARY KEY" },
            { name: "Code", type: "TEXT NOT NULL" },
            { name: "Description1", type: "TEXT NOT NULL" },
            { name: "Description2", type: "TEXT NULL" },
            { name: "Type", type: "CHAR" }
          ]
        },
        {
          name: tableNames.config.printerSettings,
          columns: [
            { name: "Id", type: "INT NOT NULL PRIMARY KEY" },
            { name: "Type", type: "TEXT NOT NULL" },
            { name: "Sequence", type: "INT NOT NULL" },
            { name: "Text", type: "TEXT NULL" },
            { name: "IsBold", type: "BOOL" }
          ]
        },
        {
          name: tableNames.config.machines,
          columns: [
            { name: "Id", type: "INT NOT NULL PRIMARY KEY" },
            { name: "Code", type: "TEXT NOT NULL" },
            { name: "Description1", type: "TEXT NOT NULL" },
            { name: "Description2", type: "TEXT NULL" },
            { name: "LocationId", type: "INT" }
          ]
        },
        {
          name: tableNames.pwp.itemsByPwp,
          columns: [
            { name: "Id", type: "INT NOT NULL PRIMARY KEY" },
            { name: "PwpId", type: "INT NOT NULL" },
            { name: "ItemId", type: "INT NOT NULL" },
            { name: "MaxQuantity", type: "INT NOT NULL" },
            { name: "DiscountId", type: "INT" },
            { name: "Price", type: "DOUBLE NOT NULL" },
            { name: "IsDefault", type: "BOOL" },
          ]
        },
        {
          name: tableNames.pwp.pwp,
          columns: [
            { name: "Id", type: "INT NOT NULL PRIMARY KEY" },
            { name: "Code", type: "TEXT NOT NULL" },
            { name: "Description1", type: "TEXT NOT NULL" },
            { name: "Description2", type: "TEXT NULL" },
            { name: "PriceLevelId", type: "INT NOT NULL" },
            { name: "FromDate", type: "DATETIME NOT NULL" },
            { name: "ToDate", type: "DATETIME NOT NULL" },
            { name: "ItemId", type: "INT NOT NULL" },
            { name: "Quantity", type: "INT" },
            { name: "MaxQuantity", type: "INT" },
            { name: "MaxNoOfItems", type: "INT" },
            { name: "MaxNoOfItemsPerReceipt", type: "INT" },
            { name: "MaxPrice", type: "DOUBLE" },
            { name: "IsMultiItemPromotion", type: "BOOL" },
          ]
        }
      ]
    });
