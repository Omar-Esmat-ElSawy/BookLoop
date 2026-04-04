export const SUPPORT_CATEGORIES = [
  {
    id: 'book_issues',
    labelKey: 'support.categories.bookIssues',
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
    subcategories: [
      'support.subcategories.bookNotAsDescribed',
      'support.subcategories.poorBookCondition',
      'support.subcategories.misleadingImages',
      'support.subcategories.bookUnavailable'
    ]
  },
  {
    id: 'exchange_problems',
    labelKey: 'support.categories.exchangeProblems',
    color: 'bg-orange-500',
    hoverColor: 'hover:bg-orange-600',
    subcategories: [
      'support.subcategories.userNotResponding',
      'support.subcategories.agreementNotFulfilled',
      'support.subcategories.deliveryDelay',
      'support.subcategories.disagreementTerms'
    ]
  },
  {
    id: 'user_reports',
    labelKey: 'support.categories.userReports',
    color: 'bg-red-500',
    hoverColor: 'hover:bg-red-600',
    subcategories: [
      'support.subcategories.inappropriateBehavior',
      'support.subcategories.spamHarassment',
      'support.subcategories.scamFraud',
      'support.subcategories.fakeAccount'
    ]
  },
  {
    id: 'account_issues',
    labelKey: 'support.categories.accountIssues',
    color: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-600',
    subcategories: [
      'support.subcategories.loginNotWorking',
      'support.subcategories.forgotPassword',
      'support.subcategories.editAccountDetails',
      'support.subcategories.deleteAccount'
    ]
  },
  {
    id: 'payment_issues',
    labelKey: 'support.categories.paymentIssues',
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
    subcategories: [
      'support.subcategories.paymentFailure',
      'support.subcategories.chargedNoService',
      'support.subcategories.refundRequest'
    ]
  },
  {
    id: 'technical_issues',
    labelKey: 'support.categories.technicalIssues',
    color: 'bg-gray-500',
    hoverColor: 'hover:bg-gray-600',
    subcategories: [
      'support.subcategories.websiteNotLoading',
      'support.subcategories.bugsErrors',
      'support.subcategories.uploadIssues',
      'support.subcategories.slowPerformance'
    ]
  },
  {
    id: 'suggestions',
    labelKey: 'support.categories.suggestions',
    color: 'bg-yellow-500',
    hoverColor: 'hover:bg-yellow-600',
    subcategories: [
      'support.subcategories.newFeatureRequest',
      'support.subcategories.uxImprovements',
      'support.subcategories.generalIdeas'
    ]
  },
  {
    id: 'general_inquiry',
    labelKey: 'support.categories.generalInquiry',
    color: 'bg-teal-500',
    hoverColor: 'hover:bg-teal-600',
    subcategories: [
      'support.subcategories.otherQuestion'
    ]
  }
];

export type SupportCategoryId = typeof SUPPORT_CATEGORIES[number]['id'];

export const getCategoryById = (id: string) => 
  SUPPORT_CATEGORIES.find(cat => cat.id === id) || SUPPORT_CATEGORIES[SUPPORT_CATEGORIES.length - 1];

export const getCategoryColor = (categoryId: string | null) => {
  if (!categoryId) return 'bg-gray-400';
  const category = SUPPORT_CATEGORIES.find(cat => cat.id === categoryId);
  return category ? category.color : 'bg-gray-400';
};
