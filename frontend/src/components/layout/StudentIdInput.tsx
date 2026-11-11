import React, { useState, useEffect } from "react";
import {
  User,
  AlertCircle,
  ArrowLeftRight,
  SendHorizontal,
  Sparkles,
  Lock,
} from "lucide-react";
import { useStudent } from "../../context/StudentContext";
import { useToast } from "../../context/ToastContext";
import { SwitchStudentModal } from "./SwitchStudentModal";

const DEMO_STUDENT_A = "20152691234567890";
const DEMO_STUDENT_B = "20152699876543210";

export const StudentIdInput: React.FC = () => {
  const { studentId, setStudentId, isIdentified, clearStudent } = useStudent();
  const { addToast } = useToast();
  const [inputValue, setInputValue] = useState(studentId);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);

  // Keep local input in sync whenever context studentId changes (e.g. cleared on switch)
  useEffect(() => {
    setInputValue(studentId);
  }, [studentId]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const sanitized = inputValue.replace(/\D/g, "").slice(0, 17);

    if (sanitized.length !== 17) {
      addToast(
        "error",
        `Birth Registration Number must be exactly 17 digits. (${sanitized.length}/17 entered)`,
        "Invalid BRN",
      );
      return;
    }

    setStudentId(sanitized);
    addToast(
      "success",
      `Student ID ${sanitized} confirmed. You can now apply for admission.`,
      "Identity Set",
    );
  };

  const handleQuickFill = () => {
    const nextDemo =
      inputValue === DEMO_STUDENT_A ? DEMO_STUDENT_B : DEMO_STUDENT_A;
    setInputValue(nextDemo);
    document.getElementById("top-brn-input")?.focus();
  };

  const handleConfirmSwitch = () => {
    clearStudent();
    setInputValue("");
    setIsSwitchModalOpen(false);
    addToast(
      "warning",
      "Student identity cleared. You can now enter another 17-digit BRN in the input above.",
      "Switched Student",
    );
    // Focus the input box for convenient entry of next student
    setTimeout(() => {
      document.getElementById("top-brn-input")?.focus();
    }, 100);
  };

  const isCommittedAndActive =
    isIdentified && inputValue === studentId && studentId.length === 17;
  const isReadyToSubmit =
    inputValue.length === 17 && (!isIdentified || inputValue !== studentId);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap items-stretch sm:items-center gap-2 w-full md:w-auto min-w-0"
    >
      {/* Required Top-of-Page 17-Digit Student BRN Input Box */}
      <div
        className={`flex items-center gap-2 py-1.5 px-2.5 sm:px-3 rounded-xl border transition-all w-full sm:w-auto min-w-0 ${
          isCommittedAndActive
            ? "bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/10"
            : inputValue.length > 0
              ? "bg-slate-50 border-blue-300 ring-2 ring-blue-500/10"
              : "bg-slate-50 border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10"
        }`}
      >
        <User
          className={`w-4 h-4 shrink-0 ${isCommittedAndActive ? "text-emerald-600" : "text-slate-500"}`}
          aria-hidden="true"
        />
        <div className="flex flex-col flex-1 min-w-0">
          <label
            htmlFor="top-brn-input"
            className={`text-[9px] min-[320px]:text-[10px] font-bold uppercase tracking-wider leading-tight ${
              isIdentified
                ? "text-emerald-700 cursor-default"
                : "text-slate-500 cursor-pointer"
            }`}
          >
            Student Birth Registration Number (17 Digits)
          </label>
          <input
            id="top-brn-input"
            type="text"
            inputMode="numeric"
            enterKeyHint="done"
            maxLength={17}
            disabled={isIdentified}
            placeholder="e.g. 20152691234567890"
            value={inputValue}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 17);
              setInputValue(val);
            }}
            title={
              isIdentified
                ? "Identity locked. Click 'Switch Student' to enter a different BRN."
                : "Enter 17-digit Birth Registration Number"
            }
            className="bg-transparent text-xs min-[320px]:text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden w-full sm:w-52 min-w-0 disabled:text-slate-900 disabled:opacity-100 disabled:cursor-not-allowed"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
          />
        </div>

        {/* Real-time Status / Counter */}
        {inputValue.length > 0 &&
          (isCommittedAndActive ? (
            <span
              title="Student ID locked (click Switch Student to change)"
              className="shrink-0 flex items-center gap-1 text-emerald-700 text-xs font-semibold"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              <span className="hidden md:inline">Active</span>
            </span>
          ) : (
            <span
              className={`text-[11px] sm:text-xs font-mono flex items-center gap-1 shrink-0 ${
                inputValue.length === 17
                  ? "text-blue-600 font-bold"
                  : "text-amber-600"
              }`}
              title={`${inputValue.length}/17 digits`}
            >
              {inputValue.length === 17 ? (
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] uppercase font-bold tracking-wider">
                  Ready
                </span>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  {inputValue.length}/17
                </>
              )}
            </span>
          ))}
      </div>

      {/* Explicit Submit & Quick Fill Demo Buttons (Visible when typing or not yet committed) */}
      {!isCommittedAndActive && (
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 w-full sm:w-auto shrink-0">
          <button
            type="submit"
            disabled={inputValue.length !== 17}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              isReadyToSubmit
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-75"
            }`}
            title={
              isReadyToSubmit
                ? "Click to set and activate student identity"
                : "Enter 17 digits to submit"
            }
          >
            <SendHorizontal className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Submit ID</span>
          </button>

          <button
            type="button"
            onClick={handleQuickFill}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer whitespace-nowrap"
            title="Quick fill a valid 17-digit demo BRN (e.g. 20152691234567890)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
            <span>Demo ID</span>
          </button>
        </div>
      )}

      {/* Switch Student Action Button (Available when identified and committed) */}
      {isCommittedAndActive && (
        <button
          type="button"
          onClick={() => setIsSwitchModalOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          title="Switch to another student applicant"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
          <span>Switch Student</span>
        </button>
      )}

      {/* Switch Confirmation Modal */}
      <SwitchStudentModal
        isOpen={isSwitchModalOpen}
        studentId={studentId}
        onClose={() => setIsSwitchModalOpen(false)}
        onConfirm={handleConfirmSwitch}
      />
    </form>
  );
};
