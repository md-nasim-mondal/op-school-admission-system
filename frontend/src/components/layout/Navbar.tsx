import { NavLink } from "react-router-dom";
import { School, Shield } from "lucide-react";
import { StudentIdInput } from "./StudentIdInput";

export const Navbar: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 xl:sticky xl:top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-2.5 min-[320px]:px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between py-2.5 sm:py-3 gap-2.5 sm:gap-3 xl:gap-4">
          {/* Logo & Brand */}
          <NavLink
            to="/"
            className="flex items-center gap-2.5 sm:gap-3 hover:opacity-95 transition-opacity min-w-0 self-start xl:self-auto"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <School className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                School Admission System
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-tight">
                Onnorokom Projukti Limited
              </p>
            </div>
          </NavLink>

          {/* Student Identity & Navigation Links */}
          <div className="flex flex-col md:flex-row md:flex-wrap xl:flex-nowrap items-stretch md:items-center justify-between xl:justify-end gap-2.5 sm:gap-3 w-full xl:w-auto min-w-0">
            <StudentIdInput />

            {/* Portal Navigation using React Router NavLink */}
            <nav
              aria-label="Primary"
              className="flex flex-wrap bg-slate-100 p-1 rounded-lg border border-slate-200 w-full md:w-auto shrink-0"
            >
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex-1 md:flex-initial text-center flex items-center justify-center px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-white text-blue-700 shadow-xs ring-1 ring-blue-200/70"
                      : "text-slate-600 hover:text-slate-900"
                  }`
                }
              >
                Student Portal
              </NavLink>

              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex-1 md:flex-initial text-center flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-white text-indigo-700 shadow-xs ring-1 ring-indigo-200/70"
                      : "text-slate-600 hover:text-slate-900"
                  }`
                }
              >
                <Shield className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                Admin
              </NavLink>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
