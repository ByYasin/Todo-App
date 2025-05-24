  // Mevcut abonelik bilgisi - refreshedUser kullanılıyor
        {refreshedUser && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium text-blue-800 dark:text-blue-300">Mevcut Aboneliğiniz</h2>
                <div className="flex items-center mt-2">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">
                    {SUBSCRIPTION_PLANS[getUserPlan(refreshedUser)].name} Plan
                  </span>
                  <span className="ml-3 bg-blue-100 dark:bg-blue-800/40 px-3 py-1 rounded-full text-sm text-blue-700 dark:text-blue-300 font-medium">
                    {SUBSCRIPTION_PLANS[getUserPlan(refreshedUser)].price.toFixed(2)} ₺/ay
                  </span>
                  
                  {/* Yenile butonu */}
                  <button
                    onClick={() => {
                      // Sayfayı yenileyin ve localStorage'dan en güncel verileri çekin
                      window.location.reload();
                    }}
                    className="ml-3 bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full flex items-center justify-center"
                    title="Abonelik bilgilerini yenile"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {subscriptionInfo && (
                <div className="bg-white dark:bg-[#1c2732] shadow-sm rounded-lg p-4 border border-blue-100 dark:border-blue-800/60">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Yenileme Tarihi</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )} 