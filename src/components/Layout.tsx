import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Home,
  Box,
  Truck,
  ShoppingCart,
  Package,
  Smartphone,
  Settings,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Inventory', href: '/inventory', icon: Smartphone },
  { name: 'Goods In', href: '/goods-in', icon: Package },
  { name: 'Goods Out', href: '/goods-out', icon: Truck },
  { name: 'Sales Orders', href: '/sales', icon: ShoppingCart },
  { name: 'Purchase Orders', href: '/purchases', icon: Box },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Layout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200">
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="p-6">
            <Link to="/">
              <span className="text-2xl font-semibold text-gray-900">
                Inventory
              </span>
            </Link>
          </div>
          <nav className="px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-6 w-6 ${
                      isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
