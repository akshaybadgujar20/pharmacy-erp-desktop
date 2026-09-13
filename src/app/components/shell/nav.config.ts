export interface NavItemConfig {
  icon: string;
  label: string;
  route?: string;
  permission?: string;
  subItems?: NavItemConfig[];
  isActive?: boolean;
  badge?: string;
}

export interface NavGroupConfig {
  label: string;
  items: NavItemConfig[];
}

export const ERP_NAV_GROUPS: NavGroupConfig[] = [
  {
    label: 'nav.groups.main',
    items: [
      { icon: 'home', label: 'nav.dashboard', route: '/dashboard' },
    ],
  },
  {
    label: 'nav.groups.sales',
    items: [
      {
        icon: 'shopping-cart',
        label: 'nav.sales.title',
        subItems: [
          { icon: 'file', label: 'nav.sales.invoices', route: '/sales/invoices', permission: 'SALES:SALES_INVOICE:READ' , isActive: true },
          { icon: 'undo', label: 'nav.sales.returns', route: '/sales/returns', permission: 'SALES:SALES_RETURN:READ' },
        ],
      },
    ],
  },
  {
    label: 'nav.groups.purchase',
    items: [
      {
        icon: 'truck',
        label: 'nav.purchase.title',
        subItems: [
          { icon: 'file', label: 'nav.purchase.orders', route: '/purchase/orders', permission: 'PURCHASE:PURCHASE_ORDER:READ' },
          { icon: 'file', label: 'nav.purchase.invoices', route: '/purchase/invoices', permission: 'PURCHASE:PURCHASE_INVOICE:READ' },
          { icon: 'undo', label: 'nav.purchase.returns', route: '/purchase/returns', permission: 'PURCHASE:PURCHASE_RETURN:READ' },
          { icon: 'box', label: 'nav.purchase.goodsReceipts', route: '/purchase/goods-receipts', permission: 'PURCHASE:GOODS_RECEIPT:READ' },
        ],
      },
    ],
  },
  {
    label: 'nav.groups.inventory',
    items: [
      {
        icon: 'warehouse',
        label: 'nav.inventory.title',
        subItems: [
          { icon: 'box', label: 'nav.inventory.batches', route: '/inventory/batches', permission: 'INVENTORY:BATCH:READ' },
          { icon: 'list', label: 'nav.inventory.stocks', route: '/inventory/stocks', permission: 'INVENTORY:STOCK:READ' },
          { icon: 'history', label: 'nav.inventory.movements', route: '/inventory/stock-movements', permission: 'INVENTORY:STOCK_MOVEMENT:READ' },
          { icon: 'sliders-h', label: 'nav.inventory.adjustments', route: '/inventory/stock-adjustments', permission: 'INVENTORY:STOCK_ADJUSTMENT:READ' },
          { icon: 'exchange', label: 'nav.inventory.transfers', route: '/inventory/stock-transfers', permission: 'INVENTORY:STOCK_TRANSFER:READ' },
          { icon: 'clipboard', label: 'nav.inventory.stockTakes', route: '/inventory/stock-takes', permission: 'INVENTORY:STOCK_TAKE:READ' },
        ],
      },
    ],
  },
  {
    label: 'nav.groups.parties',
    items: [
      {
        icon: 'users',
        label: 'nav.party.title',
        subItems: [
          { icon: 'user', label: 'nav.party.parties', route: '/party/parties', permission: 'PARTY:PARTY:READ' },
          { icon: 'user', label: 'nav.party.customers', route: '/party/customers', permission: 'PARTY:CUSTOMER:READ' },
          { icon: 'building', label: 'nav.party.suppliers', route: '/party/suppliers', permission: 'PARTY:SUPPLIER:READ' },
          { icon: 'heart', label: 'nav.party.doctors', route: '/party/doctors', permission: 'PARTY:DOCTOR:READ' },
          { icon: 'id-card', label: 'nav.party.employees', route: '/party/employees', permission: 'PARTY:EMPLOYEE:READ' },
        ],
      },
    ],
  },
  {
    label: 'nav.groups.medicines',
    items: [
      {
        icon: 'medkit',
        label: 'nav.medicine.title',
        subItems: [
          { icon: 'medkit', label: 'nav.medicine.medicines', route: '/medicine/medicines', permission: 'MEDICINE:MEDICINE:READ' },
          { icon: 'tags', label: 'nav.medicine.categories', route: '/medicine/categories', permission: 'MEDICINE:MEDICINE_CATEGORY:READ' },
          { icon: 'list', label: 'nav.medicine.generics', route: '/medicine/generics', permission: 'MEDICINE:MEDICINE_GENERIC:READ' },
          { icon: 'calendar', label: 'nav.medicine.schedules', route: '/medicine/schedules', permission: 'MEDICINE:MEDICINE_SCHEDULE:READ' },
          { icon: 'industry', label: 'nav.medicine.manufacturers', route: '/medicine/manufacturers', permission: 'MEDICINE:MANUFACTURER:READ' },
          { icon: 'flask', label: 'nav.medicine.saltCompositions', route: '/medicine/salt-compositions', permission: 'MEDICINE:SALT_COMPOSITION:READ' },
          { icon: 'balance-scale', label: 'nav.medicine.units', route: '/medicine/units-of-measure', permission: 'MEDICINE:UNIT_OF_MEASURE:READ' },
        ],
      },
    ],
  },
  {
    label: 'nav.groups.masters',
    items: [
      {
        icon: 'globe',
        label: 'nav.masters.title',
        subItems: [
          { icon: 'flag', label: 'nav.masters.countries', route: '/masters/countries', permission: 'LOOKUP:COUNTRY:READ' },
          { icon: 'map', label: 'nav.masters.states', route: '/masters/states', permission: 'LOOKUP:STATE:READ' },
          { icon: 'city', label: 'nav.masters.cities', route: '/masters/cities', permission: 'LOOKUP:CITY:READ' },
          { icon: 'map-marker', label: 'nav.masters.areas', route: '/masters/areas', permission: 'LOOKUP:AREA:READ' },
        ],
      },
    ],
  },
  {
    label: 'nav.groups.pricing',
    items: [
      {
        icon: 'tag',
        label: 'nav.pricing.title',
        subItems: [
          { icon: 'percent', label: 'nav.pricing.discountRules', route: '/pricing/discount-rules', permission: 'PRICING:DISCOUNT_RULE:READ' },
          { icon: 'list', label: 'nav.pricing.priceLists', route: '/pricing/price-lists', permission: 'PRICING:PRICE_LIST:READ' },
          { icon: 'money-bill', label: 'nav.pricing.taxes', route: '/pricing/taxes', permission: 'PRICING:TAX:READ' },
        ],
      },
    ],
  },
  {
    label: 'nav.groups.finance',
    items: [
      {
        icon: 'wallet',
        label: 'nav.finance.title',
        subItems: [
          { icon: 'book', label: 'nav.finance.ledgers', route: '/finance/ledgers', permission: 'FINANCE:LEDGER:READ' },
          { icon: 'credit-card', label: 'nav.finance.payments', route: '/finance/payments', permission: 'FINANCE:PAYMENT:READ' },
          { icon: 'receipt', label: 'nav.finance.receipts', route: '/finance/receipts', permission: 'FINANCE:RECEIPT:READ' },
        ],
      },
    ],
  },
  {
    label: 'nav.groups.prescriptions',
    items: [
      { icon: 'file-medical', label: 'nav.prescriptions.list', route: '/prescriptions', permission: 'PRESCRIPTION:PRESCRIPTION:READ' },
    ],
  },
  {
    label: 'nav.groups.reports',
    items: [
      { icon: 'chart-bar', label: 'nav.reports.title', route: '/reports', permission: 'REPORT_VIEW' },
    ],
  },
  {
    label: 'nav.groups.admin',
    items: [
      {
        icon: 'shield',
        label: 'nav.security.title',
        subItems: [
          { icon: 'user', label: 'nav.security.users', route: '/security/users', permission: 'SECURITY:USER:READ' },
          { icon: 'key', label: 'nav.security.roles', route: '/security/roles', permission: 'SECURITY:ROLE:READ' },
          { icon: 'lock', label: 'nav.security.permissions', route: '/security/permissions', permission: 'SECURITY:PERMISSION:READ' },
          { icon: 'desktop', label: 'nav.security.sessions', route: '/security/user-sessions', permission: 'SECURITY:USER_SESSION:READ' },
        ],
      },
      {
        icon: 'cog',
        label: 'nav.configuration.title',
        subItems: [
          { icon: 'building', label: 'nav.configuration.companies', route: '/configuration/companies', permission: 'CONFIGURATION:COMPANY:READ' },
          { icon: 'sitemap', label: 'nav.configuration.branches', route: '/configuration/branches', permission: 'CONFIGURATION:BRANCH:READ' },
          { icon: 'calendar', label: 'nav.configuration.financialYears', route: '/configuration/financial-years', permission: 'CONFIGURATION:FINANCIAL_YEAR:READ' },
          { icon: 'sort-numeric-up', label: 'nav.configuration.sequenceGenerators', route: '/configuration/sequence-generators', permission: 'CONFIGURATION:SEQUENCE_GENERATOR:READ' },
          { icon: 'barcode', label: 'nav.configuration.barcodeConfigs', route: '/configuration/barcode-configurations', permission: 'CONFIGURATION:BARCODE_CONFIGURATION:READ' },
          { icon: 'print', label: 'nav.configuration.printerConfigs', route: '/configuration/printer-configurations', permission: 'CONFIGURATION:PRINTER_CONFIGURATION:READ' },
        ],
      },
      { icon: 'sliders-h', label: 'nav.settings.title', route: '/settings', permission: 'CONFIGURATION:APP_SETTING:READ' },
    ],
  },
];
