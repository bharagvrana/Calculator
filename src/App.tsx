import { useState, useCallback } from "react";

type ButtonType = "number" | "operator" | "equals" | "clear" | "special";

interface CalcButton {
  label: string;
  value: string;
  type: ButtonType;
  span?: number;
}

const buttons: CalcButton[][] = [
  [
    { label: "AC", value: "AC", type: "clear" },
    { label: "+/-", value: "+/-", type: "special" },
    { label: "%", value: "%", type: "special" },
    { label: "÷", value: "/", type: "operator" },
  ],
  [
    { label: "7", value: "7", type: "number" },
    { label: "8", value: "8", type: "number" },
    { label: "9", value: "9", type: "number" },
    { label: "×", value: "*", type: "operator" },
  ],
  [
    { label: "4", value: "4", type: "number" },
    { label: "5", value: "5", type: "number" },
    { label: "6", value: "6", type: "number" },
    { label: "−", value: "-", type: "operator" },
  ],
  [
    { label: "1", value: "1", type: "number" },
    { label: "2", value: "2", type: "number" },
    { label: "3", value: "3", type: "number" },
    { label: "+", value: "+", type: "operator" },
  ],
  [
    { label: "0", value: "0", type: "number", span: 2 },
    { label: ".", value: ".", type: "number" },
    { label: "=", value: "=", type: "equals" },
  ],
];

const buttonStyles: Record<ButtonType, string> = {
  number: "bg-[#333333] hover:bg-[#4a4a4a] text-white",
  operator: "bg-[#FF9F0A] hover:bg-[#ffb340] text-white",
  equals: "bg-[#FF9F0A] hover:bg-[#ffb340] text-white",
  clear: "bg-[#a5a5a5] hover:bg-[#c0c0c0] text-black",
  special: "bg-[#a5a5a5] hover:bg-[#c0c0c0] text-black",
};

export default function App() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForSecond, setWaitingForSecond] = useState(false);
  const [justCalculated, setJustCalculated] = useState(false);

  const formatDisplay = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    if (Math.abs(num) >= 1e15) return num.toExponential(5);
    const formatted = parseFloat(num.toPrecision(12)).toString();
    return formatted;
  };

  const getFontSize = (text: string) => {
    const len = text.length;
    if (len <= 6) return "text-6xl";
    if (len <= 9) return "text-5xl";
    if (len <= 12) return "text-4xl";
    return "text-3xl";
  };

  const handleNumber = useCallback(
    (value: string) => {
      if (waitingForSecond) {
        setDisplay(value === "." ? "0." : value);
        setWaitingForSecond(false);
        setJustCalculated(false);
        return;
      }
      if (justCalculated) {
        setDisplay(value === "." ? "0." : value);
        setExpression("");
        setJustCalculated(false);
        return;
      }
      if (value === ".") {
        if (display.includes(".")) return;
        setDisplay(display + ".");
        return;
      }
      if (display === "0" || display === "Error") {
        setDisplay(value);
      } else {
        if (display.replace("-", "").replace(".", "").length >= 9) return;
        setDisplay(display + value);
      }
    },
    [display, waitingForSecond, justCalculated]
  );

  const handleOperator = useCallback(
    (value: string) => {
      const current = parseFloat(display);
      if (firstOperand !== null && !waitingForSecond) {
        const result = calculate(firstOperand, current, operator!);
        const resultStr = formatDisplay(result.toString());
        setDisplay(resultStr);
        setFirstOperand(result);
        setExpression(`${resultStr} ${getOpSymbol(value)}`);
      } else {
        setFirstOperand(current);
        setExpression(`${display} ${getOpSymbol(value)}`);
      }
      setOperator(value);
      setWaitingForSecond(true);
      setJustCalculated(false);
    },
    [display, firstOperand, operator, waitingForSecond]
  );

  const getOpSymbol = (op: string) => {
    const map: Record<string, string> = {
      "+": "+",
      "-": "−",
      "*": "×",
      "/": "÷",
    };
    return map[op] || op;
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b === 0 ? NaN : a / b;
      default: return b;
    }
  };

  const handleEquals = useCallback(() => {
    if (firstOperand === null || operator === null) return;
    const current = parseFloat(display);
    const result = calculate(firstOperand, current, operator);
    const resultStr = isNaN(result) ? "Error" : formatDisplay(result.toString());
    setExpression(`${firstOperand} ${getOpSymbol(operator)} ${current} =`);
    setDisplay(resultStr);
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecond(false);
    setJustCalculated(true);
  }, [display, firstOperand, operator]);

  const handleClear = useCallback(() => {
    setDisplay("0");
    setExpression("");
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecond(false);
    setJustCalculated(false);
  }, []);

  const handleSpecial = useCallback(
    (value: string) => {
      if (value === "+/-") {
        const num = parseFloat(display);
        if (!isNaN(num)) {
          setDisplay(formatDisplay((-num).toString()));
        }
      } else if (value === "%") {
        const num = parseFloat(display);
        if (!isNaN(num)) {
          setDisplay(formatDisplay((num / 100).toString()));
        }
      }
    },
    [display]
  );

  const handleButton = (btn: CalcButton) => {
    switch (btn.type) {
      case "number":
        handleNumber(btn.value);
        break;
      case "operator":
        handleOperator(btn.value);
        break;
      case "equals":
        handleEquals();
        break;
      case "clear":
        handleClear();
        break;
      case "special":
        handleSpecial(btn.value);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-xs">
        {/* Calculator Body */}
        <div className="bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border border-[#2a2a2a]">
          {/* Display */}
          <div className="px-6 pt-10 pb-4 flex flex-col items-end justify-end min-h-[160px]">
            {/* Expression */}
            <div className="text-[#888] text-sm mb-1 h-5 truncate w-full text-right">
              {expression}
            </div>
            {/* Main Display */}
            <div
              className={`text-white font-light tracking-tight transition-all duration-100 ${getFontSize(
                display
              )}`}
            >
              {display}
            </div>
          </div>

          {/* Buttons Grid */}
          <div className="grid grid-cols-4 gap-3 p-4">
            {buttons.flat().map((btn, index) =>
              btn.span ? (
                <button
                  key={index}
                  onClick={() => handleButton(btn)}
                  className={`col-span-2 rounded-full py-5 text-2xl font-medium text-left pl-8 transition-all duration-100 active:scale-95 ${buttonStyles[btn.type]}`}
                >
                  {btn.label}
                </button>
              ) : (
                <button
                  key={index}
                  onClick={() => handleButton(btn)}
                  className={`rounded-full aspect-square text-2xl font-medium flex items-center justify-center transition-all duration-100 active:scale-95 ${buttonStyles[btn.type]}`}
                >
                  {btn.label}
                </button>
              )
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[#444] text-xs mt-6 tracking-widest uppercase">
          Calculator
        </p>
      </div>
    </div>
  );
}
