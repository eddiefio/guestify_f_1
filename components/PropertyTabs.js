// components/PropertyTabs.js
import Link from 'next/link';

export default function PropertyTabs({ propertyId, activeTab, propertyName }) {
  const tabs = [
    { id: 'analytics', label: 'Analytics', href: `/host/analytics/${propertyId}` },
    { id: 'orders', label: 'Orders', href: `/host/orders/${propertyId}` },
    { id: 'inventory', label: 'Inventory', href: `/host/inventory/${propertyId}` },
    { id: 'printqr', label: 'Print QR', href: `/host/printqr/${propertyId}` },
  ];

  return (
    <div className="mb-6">
      {/* Back to dashboard link */}
      <div className="mb-2">
        <Link href="/host/dashboard">
          <span className="text-[#5e2bff] hover:underline flex items-center cursor-pointer">
            <i className="fas fa-arrow-left mr-1"></i> Back to Dashboard
          </span>
        </Link>
      </div>

      {/* Property name heading */}
      <h2 className="text-lg sm:text-2xl font-bold text-[#5e2bff] mb-4">
        Property: {propertyName || ''}
      </h2>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center items-center gap-2 mb-4">
        {tabs.map((tab) => (
          <Link key={tab.id} href={tab.href}>
            <span 
              className={`px-3 py-1 rounded text-sm hover:bg-gray-300 transition cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-[#fad02f] text-black font-bold hover:opacity-90' 
                  : 'bg-gray-200'
              }`}
            >
              {tab.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}