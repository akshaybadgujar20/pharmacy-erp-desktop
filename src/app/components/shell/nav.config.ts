export interface NavItemConfig {
  icon: string;
  labelKey: string;
  route?: string;
  permission?: string;
  subItems?: NavItemConfig[];
}

export interface NavGroupConfig {
  labelKey: string;
  items: NavItemConfig[];
}

export const ERP_NAV_GROUPS: NavGroupConfig[] = [
  {
    labelKey: 'nav.groups.main',
    items: [
      { icon: 'home', labelKey: 'nav.dashboard', route: '/dashboard' },
    ],
  },
  {
    labelKey: 'nav.groups.sales',
    items: [
      {
        icon: 'shopping-cart',
        labelKey: 'nav.sales.title',
        subItems: [
          { icon: 'file', labelKey: 'nav.sales.invoices', route: '/sales/invoices', permission: 'SALES:SALES_INVOICE:READ' },
          { icon: 'undo', labelKey: 'nav.sales.returns', route: '/sales/returns', permission: 'SALES:SALES_RETURN:READ' },
        ],
      },
    ],
  },
  {
    labelKey: 'nav.groups.purchase',
    items: [
      {
        icon: 'truck',
        labelKey: 'nav.purchase.title',
        subItems: [
          { icon: 'file', labelKey: 'nav.purchase.orders', route: '/purchase/orders', permission: 'PURCHASE:PURCHASE_ORDER:READ' },
          { icon: 'file', labelKey: 'nav.purchase.invoices', route: '/purchase/invoices', permission: 'PURCHASE:PURCHASE_INVOICE:READ' },
          { icon: 'undo', labelKey: 'nav.purchase.returns', route: '/purchase/returns', permission: 'PURCHASE:PURCHASE_RETURN:READ' },
          { icon: 'box', labelKey: 'nav.purchase.goodsReceipts', route: '/purchase/goods-receipts', permission: 'PURCHASE:GOODS_RECEIPT:READ' },
        ],
      },
    ],
  },
  {
    labelKey: 'nav.groups.inventory',
    items: [
      {
        icon: 'warehouse',
        labelKey: 'nav.inventory.title',
        subItems: [
          { icon: 'box', labelKey: 'nav.inventory.batches', route: '/inventory/batches', permission: 'INVENTORY:BATCH:READ' },
          { icon: 'list', labelKey: 'nav.inventory.stocks', route: '/inventory/stocks', permission: 'INVENTORY:STOCK:READ' },
          { icon: 'history', labelKey: 'nav.inventory.movements', route: '/inventory/stock-movements', permission: 'INVENTORY:STOCK_MOVEMENT:READ' },
          { icon: 'sliders-h', labelKey: 'nav.inventory.adjustments', route: '/inventory/stock-adjustments', permission: 'INVENTORY:STOCK_ADJUSTMENT:READ' },
          { icon: 'exchange', labelKey: 'nav.inventory.transfers', route: '/inventory/stock-transfers', permission: 'INVENTORY:STOCK_TRANSFER:READ' },
          { icon: 'clipboard', labelKey: 'nav.inventory.stockTakes', route: '/inventory/stock-takes', permission: 'INVENTORY:STOCK_TAKE:READ' },
        ],
      },
    ],
  },
  {
    labelKey: 'nav.groups.parties',
    items: [
      {
        icon: 'users',
        labelKey: 'nav.party.title',
        subItems: [
          { icon: 'user', labelKey: 'nav.party.parties', route: '/party/parties', permission: 'PARTY:PARTY:READ' },
          { icon: 'user', labelKey: 'nav.party.customers', route: '/party/customers', permission: 'PARTY:CUSTOMER:READ' },
          { icon: 'building', labelKey: 'nav.party.suppliers', route: '/party/suppliers', permission: 'PARTY:SUPPLIER:READ' },
          { icon: 'heart', labelKey: 'nav.party.doctors', route: '/party/doctors', permission: 'PARTY:DOCTOR:READ' },
          { icon: 'id-card', labelKey: 'nav.party.employees', route: '/party/employees', permission: 'PARTY:EMPLOYEE:READ' },
        ],
      },
    ],
  },
  {
    labelKey: 'nav.groups.medicines',
    items: [
      {
        icon: 'medkit',
        labelKey: 'nav.medicine.title',
        subItems: [
          { icon: 'medkit', labelKey: 'nav.medicine.medicines', route: '/medicine/medicines', permission: 'MEDICINE:MEDICINE:READ' },
          { icon: 'tags', labelKey: 'nav.medicine.categories', route: '/medicine/categories', permission: 'MEDICINE:MEDICINE_CATEGORY:READ' },
          { icon: 'list', labelKey: 'nav.medicine.generics', route: '/medicine/generics', permission: 'MEDICINE:MEDICINE_GENERIC:READ' },
          { icon: 'calendar', labelKey: 'nav.medicine.schedules', route: '/medicine/schedules', permission: 'MEDICINE:MEDICINE_SCHEDULE:READ' },
          { icon: 'industry', labelKey: 'nav.medicine.manufacturers', route: '/medicine/manufacturers', permission: 'MEDICINE:MANUFACTURER:READ' },
          { icon: 'flask', labelKey: 'nav.medicine.saltCompositions', route: '/medicine/salt-compositions', permission: 'MEDICINE:SALT_COMPOSITION:READ' },
          { icon: 'balance-scale', labelKey: 'nav.medicine.units', route: '/medicine/units-of-measure', permission: 'MEDICINE:UNIT_OF_MEASURE:READ' },
        ],
      },
    ],
  },
  {
    labelKey: 'nav.groups.masters',
    items: [
      {
        icon: 'globe',
        labelKey: 'nav.masters.title',
        subItems: [
          { icon: 'flag', labelKey: 'nav.masters.countries', route: '/masters/countries', permission: 'LOOKUP:COUNTRY:READ' },
          { icon: 'map', labelKey: 'nav.masters.states', route: '/masters/states', permission: 'LOOKUP:STATE:READ' },
          { icon: 'city', labelKey: 'nav.masters.cities', route: '/masters/cities', permission: 'LOOKUP:CITY:READ' },
          { icon: 'map-marker', labelKey: 'nav.masters.areas', route: '/masters/areas', permission: 'LOOKUP:AREA:READ' },
        ],
      },
    ],
  },
  {
    labelKey: 'nav.groups.pricing',
    items: [
      {
        icon: 'tag',
        labelKey: 'nav.pricing.title',
        subItems: [
          { icon: 'percent', labelKey: 'nav.pricing.discountRules', route: '/pricing/discount-rules', permission: 'PRICING:DISCOUNT_RULE:READ' },
          { icon: 'list', labelKey: 'nav.pricing.priceLists', route: '/pricing/price-lists', permission: 'PRICING:PRICE_LIST:READ' },
          { icon: 'money-bill', labelKey: 'nav.pricing.taxes', route: '/pricing/taxes', permission: 'PRICING:TAX:READ' },
        ],
      },
    ],
  },
  {
    labelKey: 'nav.groups.finance',
    items: [
      {
        icon: 'wallet',
        labelKey: 'nav.finance.title',
        subItems: [
          { icon: 'book', labelKey: 'nav.finance.ledgers', route: '/finance/ledgers', permission: 'FINANCE:LEDGER:READ' },
          { icon: 'credit-card', labelKey: 'nav.finance.payments', route: '/finance/payments', permission: 'FINANCE:PAYMENT:READ' },
          { icon: 'receipt', labelKey: 'nav.finance.receipts', route: '/finance/receipts', permission: 'FINANCE:RECEIPT:READ' },
        ],
      },
    ],
  },
  {
    labelKey: 'nav.groups.prescriptions',
    items: [
      { icon: 'file-medical', labelKey: 'nav.prescriptions.list', route: '/prescriptions', permission: 'PRESCRIPTION:PRESCRIPTION:READ' },
    ],
  },
  {
    labelKey: 'nav.groups.reports',
    items: [
      { icon: 'chart-bar', labelKey: 'nav.reports.title', route: '/reports', permission: 'REPORT_VIEW' },
    ],
  },
  {
    labelKey: 'nav.groups.admin',
    items: [
      {
        icon: 'shield',
        labelKey: 'nav.security.title',
        subItems: [
          { icon: 'user', labelKey: 'nav.security.users', route: '/security/users', permission: 'SECURITY:USER:READ' },
          { icon: 'key', labelKey: 'nav.security.roles', route: '/security/roles', permission: 'SECURITY:ROLE:READ' },
          { icon: 'lock', labelKey: 'nav.security.permissions', route: '/security/permissions', permission: 'SECURITY:PERMISSION:READ' },
          { icon: 'desktop', labelKey: 'nav.security.sessions', route: '/security/user-sessions', permission: 'SECURITY:USER_SESSION:READ' },
        ],
      },
      {
        icon: 'cog',
        labelKey: 'nav.configuration.title',
        subItems: [
          { icon: 'building', labelKey: 'nav.configuration.companies', route: '/configuration/companies', permission: 'CONFIGURATION:COMPANY:READ' },
          { icon: 'sitemap', labelKey: 'nav.configuration.branches', route: '/configuration/branches', permission: 'CONFIGURATION:BRANCH:READ' },
          { icon: 'calendar', labelKey: 'nav.configuration.financialYears', route: '/configuration/financial-years', permission: 'CONFIGURATION:FINANCIAL_YEAR:READ' },
          { icon: 'sort-numeric-up', labelKey: 'nav.configuration.sequenceGenerators', route: '/configuration/sequence-generators', permission: 'CONFIGURATION:SEQUENCE_GENERATOR:READ' },
          { icon: 'barcode', labelKey: 'nav.configuration.barcodeConfigs', route: '/configuration/barcode-configurations', permission: 'CONFIGURATION:BARCODE_CONFIGURATION:READ' },
          { icon: 'print', labelKey: 'nav.configuration.printerConfigs', route: '/configuration/printer-configurations', permission: 'CONFIGURATION:PRINTER_CONFIGURATION:READ' },
        ],
      },
      { icon: 'sliders-h', labelKey: 'nav.settings.title', route: '/settings', permission: 'CONFIGURATION:APP_SETTING:READ' },
    ],
  },
];
