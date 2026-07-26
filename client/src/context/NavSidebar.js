// side bar for a certain role types
export const NAVSIDEBAR = {
  customer: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Accounts', path: '/accounts' },
    { label: 'Transfer', path: '/transfer' },
    { label: 'Beneficiaries', path: '/beneficiaries' },
    { label: 'Loans', path: '/loans' },
    { label: 'Cards', path: '/cards' },
    { label: 'Notifications', path: '/notifications' },
    { label: 'Profile', path: '/profile' }
  ],
  teller: [
    { label: 'Teller Dashboard', path: '/teller/dashboard' },
    { label: 'Customer Search', path: '/teller/customers' },
    { label: 'New Customer', path: '/teller/new-customer' },
    { label: 'Open Account', path: '/teller/open-account' },
    { label: 'Deposit / Withdraw', path: '/teller/cash' },
    { label: 'Beneficiary Approvals', path: '/teller/beneficiaries' }
  ],
  'loan-officer': [
    { label: 'Loan Queue', path: '/loans/queue' },
    { label: 'Loan Review', path: '/loans/review' }
  ],
  'compliance-officer': [
    { label: 'Fraud Alerts', path: '/compliance/fraud' },
    { label: 'Beneficiary Approvals', path: '/compliance/beneficiaries' },
    { label: 'Card Reviews', path: '/compliance/cards' },
    { label: 'Audit Logs', path: '/compliance/audit-logs' }
  ],
  'branch-manager': [
    { label: 'Branch Dashboard', path: '/branch/dashboard' },
    { label: 'Approvals Queue', path: '/branch/approvals' },
    { label: 'Teams', path: '/branch/teams' },
    { label: 'Employees', path: '/branch/employees' }
  ],
  admin: [
    { label: 'Users', path: '/admin/users' },
    { label: 'Employees', path: '/admin/employees' },
    { label: 'Branches', path: '/admin/branches' },
    { label: 'Teams', path: '/admin/teams' },
    { label: 'System Settings', path: '/admin/settings' }
  ]
};