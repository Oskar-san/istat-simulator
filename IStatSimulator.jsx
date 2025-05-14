
import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function IStatSimulator() {
  const [inputs, setInputs] = useState({
    bloodLoss: 0,
    timeSinceInjury: "00:00",
    lungFunction: 100,
    transfusedBlood: 0,
    transfusedPlasma: 0,
    bodyWeight: 70,
  });

  const [screenType, setScreenType] = useState("cg8");
  const [results, setResults] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const displayRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs({ ...inputs, [name]: value });
  };

  const handleResultChange = (key, value) => {
    setResults({
      ...results,
      [key]: {
        ...results[key],
        value,
      },
    });
  };

  const simulateResults = () => {
    const estimatedBloodVolume = inputs.bodyWeight * 70;
    const bloodLossFraction = Math.min(inputs.bloodLoss / estimatedBloodVolume, 1);
    const lungFactor = 1 - inputs.lungFunction / 100;

    const result = {
      pH: { value: (7.4 - 0.1 * bloodLossFraction).toFixed(2), unit: "" },
      pCO2: { value: (5.3 + 0.5 * lungFactor).toFixed(1), unit: "kPa" },
      pO2: { value: (12 - 4 * lungFactor).toFixed(1), unit: "kPa" },
      Na: { value: 138, unit: "mmol/L" },
      K: { value: (4 + 0.3 * bloodLossFraction).toFixed(1), unit: "mmol/L" },
      iCa: { value: (1.15 - 0.05 * bloodLossFraction).toFixed(2), unit: "mmol/L" },
      Glukos: { value: 6.2, unit: "mmol/L" },
      Laktat: { value: (1 + 5 * bloodLossFraction).toFixed(1), unit: "mmol/L" },
      Hct: { value: (40 - 15 * bloodLossFraction + 5 * inputs.transfusedBlood / 500).toFixed(0), unit: "%" },
      Hb: { value: ((13.5 - 5 * bloodLossFraction + 2 * inputs.transfusedBlood / 500) * 10).toFixed(0), unit: "g/L" },
      BE: { value: (-7 * bloodLossFraction).toFixed(1), unit: "mmol/L" },
      HCO3: { value: (24 - 6 * bloodLossFraction).toFixed(1), unit: "mmol/L" },
      SO2: { value: (98 - 10 * lungFactor).toFixed(0), unit: "%" },
    };
    setResults(result);
  };

  const exportAsImage = (format) => {
    const node = displayRef.current;
    if (!node) return;

    setTimeout(() => {
      html2canvas(node, { scale: 2, useCORS: true }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");

        if (format === 'png') {
          const link = document.createElement("a");
          link.download = `istat-${screenType}-screen.png`;
          link.href = imgData;
          link.click();
        } else if (format === 'pdf') {
          const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width, canvas.height] });
          pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
          pdf.save(`istat-${screenType}-screen.pdf`);
        }
      });
    }, 100);
  };

  const renderDisplay = () => {
    if (!results) return null;
    const displayFields = screenType === "cg8"
      ? ["pH", "pCO2", "pO2", "Na", "K", "iCa", "Glukos", "Laktat", "Hct", "Hb", "BE", "HCO3", "SO2"]
      : ["pH", "pCO2", "pO2", "Laktat", "BE", "HCO3"];

    return (
      <div ref={displayRef} className="border rounded-xl p-4 mt-4 max-w-md mx-auto bg-white text-gray-800 font-mono shadow-md">
        <h2 className="text-xl mb-2 font-bold">i-STAT {screenType.toUpperCase()} Skärm</h2>
        <div className="flex flex-col gap-y-1">
          {displayFields.map((key) => (
            <div key={key} className="flex justify-between border-b py-1">
              <span>{key}</span>
              {editMode ? (
                <input
                  className="bg-white border px-1 w-24 text-right"
                  type="text"
                  value={results[key].value}
                  onChange={(e) => handleResultChange(key, e.target.value)}
                />
              ) : (
                <span>{results[key].value} {results[key].unit}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="border rounded-xl p-4 bg-white shadow">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Simulera Blodgas</h2>
          {Object.entries(inputs).map(([key, val]) => (
            <div key={key} className="flex flex-col">
              <label htmlFor={key} className="font-semibold">{key}</label>
              <input className="border p-1" 
                id={key}
                name={key}
                type={key === "timeSinceInjury" ? "time" : "number"}
                value={val}
                onChange={handleInputChange}
               />
            </div>
          ))}
          <button onClick={simulateResults} className="bg-blue-600 text-white px-4 py-2 rounded">Generera Blodgas</button>
          <div className="flex space-x-2">
            <button onClick={() => setScreenType("cg8")} className="border px-3 py-1 rounded">Visa CG8</button>
            <button onClick={() => setScreenType("cg4")} className="border px-3 py-1 rounded">Visa CG4</button>
            <button onClick={() => setEditMode(!editMode)} className="border px-3 py-1 rounded">
              {editMode ? "Lås Redigering" : "Redigera Värden"}
            </button>
          </div>
        </div>
      </div>
      {renderDisplay()}
    </div>
  );
}
