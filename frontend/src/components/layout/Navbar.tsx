import { NavLink } from "react-router-dom";
import { School, Shield } from "lucide-react";
import { StudentIdInput } from "./StudentIdInput";

export const Navbar: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 gap-4">
          {/* Logo & Brand */}
          <NavLink
            to="/"
            className="flex items-center gap-3 hover:opacity-95 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                School Admission System
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Onnorokom Projukti Limited
              </p>
            </div>
          </NavLink>

          {/* Student Identity & Navigation Links */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <StudentIdInput />

            {/* Portal Navigation using React Router NavLink */}
            <nav className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    isActive
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`
                }
              >
                Student Portal
              </NavLink>

              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    isActive
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`
                }
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </NavLink>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
