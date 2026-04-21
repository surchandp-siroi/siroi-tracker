"use strict";
"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Button, Card, CardContent, CardHeader, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { Sparkles, Loader2, Save, LogOut } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { useDataStore } from "@/store/useDataStore";
export default function DataEntryTerminal() {
  const { user, isInitialized, logout } = useAuthStore();
  const router = useRouter();
  const { products, channels, branches } = useDataStore();
  const [dateStr, setDateStr] = useState(() => (/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
  const [items, setItems] = useState([]);
  const [smartPrompt, setSmartPrompt] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasExistingEntry, setHasExistingEntry] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [branchDetails, setBranchDetails] = useState(null);
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, isInitialized, router]);
  const checkDate = new Date(dateStr);
  const cutoffDate = /* @__PURE__ */ new Date("2026-05-01T00:00:00Z");
  const isDailyMode = checkDate >= cutoffDate;
  const modeLabel = isDailyMode ? "Daily Direct Tracking" : "Monthly Batch Tracking";
  useEffect(() => {
    if (!user?.branchId) return;
    const fetchContext = async () => {
      setIsLoadingExisting(true);
      setHasExistingEntry(false);
      try {
        const bDoc = await getDoc(doc(db, "branches", user.branchId));
        if (bDoc.exists()) {
          setBranchDetails(bDoc.data());
        }
        const q = query(collection(db, `branches/${user.branchId}/entries`), where("entryDate", "==", dateStr));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setHasExistingEntry(true);
          const data = snap.docs[0].data();
          setItems(data.items || []);
        } else {
          setHasExistingEntry(false);
          setItems([]);
        }
      } catch (err) {
        console.error("Failed to load context", err);
      } finally {
        setIsLoadingExisting(false);
      }
    };
    fetchContext();
  }, [user?.branchId, dateStr]);
  const handleParse = async () => {
    if (!smartPrompt.trim()) return;
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      setError("Smart fill unavailable. Contact admin to set Gemini API key.");
      return;
    }
    setIsParsing(true);
    setError("");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      const prompt = `
            Extract the financial entry data from the following text and format it as a JSON array of objects.
            Each object MUST have these EXACT keys: "category", "product", "channel", and "amount".
            
            Valid Categories: "Loan", "Insurance", "Forex", "Consultancy"
            Valid Products: ${products.map((p) => p.name).join(", ")}
            Valid Channels: ${channels.map((c) => c.name).join(", ")}
            Amount MUST be a positive number.
            
            Text: "${smartPrompt}"
            
            Return ONLY the valid JSON array without markdown formatting. Example: [{"category": "Loan", "product": "Home Loan", "channel": "HDFC BANK", "amount": 200000}]
          `;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      const text = response.text || "[]";
      const _clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(_clean);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setItems((prev) => [...prev, ...parsed]);
        setSmartPrompt("");
      } else {
        setError("Could not extract numerical items. Try adjusting your phrasing.");
      }
    } catch (e) {
      console.error("AI Parse Error:", e);
      setError("Failed to process text. You can add items manually.");
    } finally {
      setIsParsing(false);
    }
  };
  const handleAddItem = () => {
    setItems([...items, { category: "Loan", product: "", channel: "", amount: 0 }]);
  };
  const handleUpdateItem = (index, key, val) => {
    const arr = [...items];
    arr[index] = { ...arr[index], [key]: val };
    if (key === "category") {
      arr[index].product = "";
    }
    setItems(arr);
  };
  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };
  const handleSubmit = async () => {
    if (!user || !user.branchId) {
      setError("You do not have a branch assigned yet. Contact Administrator.");
      return;
    }
    if (items.length === 0) {
      setError("Please add at least one line item.");
      return;
    }
    if (items.some((i) => !i.category || !i.product || !i.channel || i.amount <= 0)) {
      setError("Please ensure all items have a valid category, product, channel and amount > 0.");
      return;
    }
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      await addDoc(collection(db, `branches/${user.branchId}/entries`), {
        branchId: user.branchId,
        entryDate: dateStr,
        mode: isDailyMode ? "daily" : "monthly",
        items,
        totalAmount,
        authorId: user.id,
        authorEmail: user.email,
        latitude: user.latestLocation?.lat || null,
        longitude: user.latestLocation?.lng || null,
        createdAt: serverTimestamp()
      });
      setSuccess("Tracking submitted successfully. Record locked.");
      setHasExistingEntry(true);
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message || "Failed to submit tracking data.");
    } finally {
      setIsSaving(false);
    }
  };
  if (!isInitialized || !user) {
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen flex items-center justify-center text-slate-500" }, /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin mr-2" }), " Initializing Identity...");
  }
  if (user.role === "admin") {
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen flex items-center justify-center flex-col p-4" }, /* @__PURE__ */ React.createElement("h1", { className: "text-xl font-bold mb-4 dark:text-white" }, "Admin access to terminal blocked."), /* @__PURE__ */ React.createElement("p", { className: "text-slate-500 mb-6 font-mono text-xs uppercase tracking-widest" }, "Admins must use the dashboard."), /* @__PURE__ */ React.createElement(Button, { onClick: () => router.push("/dashboard") }, "Go to Dashboard"));
  }
  const allowedProducts = (category) => products.filter((p) => p.category === category);
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen p-4 md:p-8 flex flex-col max-w-5xl mx-auto" }, /* @__PURE__ */ React.createElement("header", { className: "glass px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-1" }, "State Head Terminal"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1" }, branchDetails ? branchDetails.name : "Unknown Branch", " \u2022 ", user.email)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement(Button, { variant: "ghost", className: "text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs", onClick: () => {
    logout();
    router.push("/login");
  } }, /* @__PURE__ */ React.createElement(LogOut, { size: 14, className: "mr-2" }), " Log Out"))), /* @__PURE__ */ React.createElement("div", { className: "grid lg:grid-cols-3 gap-6" }, /* @__PURE__ */ React.createElement(Card, { className: "lg:col-span-1 glass border-slate-900/10 dark:border-white/10 self-start" }, /* @__PURE__ */ React.createElement(CardHeader, { className: "border-b border-slate-900/10 dark:border-white/10 p-4 bg-slate-900/5 dark:bg-white/5" }, /* @__PURE__ */ React.createElement("h3", { className: "text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300" }, "Tracking Controls")), /* @__PURE__ */ React.createElement(CardContent, { className: "p-4 space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("label", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-wider" }, "Date Context"), /* @__PURE__ */ React.createElement(
    Input,
    {
      type: "date",
      value: dateStr,
      onChange: (e) => setDateStr(e.target.value),
      className: "bg-slate-900/5 dark:bg-black/20"
    }
  ), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-400 mt-2 leading-relaxed" }, "Selected mode: ", /* @__PURE__ */ React.createElement("strong", { className: "text-indigo-600 dark:text-indigo-400" }, modeLabel), /* @__PURE__ */ React.createElement("br", null), "(Daily mode active from May 1st, 2026)")), /* @__PURE__ */ React.createElement("div", { className: "pt-4 border-t border-slate-900/10 dark:border-white/10 space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Sparkles, { size: 14, className: "text-indigo-600 dark:text-indigo-400" }), /* @__PURE__ */ React.createElement("label", { className: "text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider" }, "Smart Assist")), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      disabled: hasExistingEntry,
      value: smartPrompt,
      onChange: (e) => setSmartPrompt(e.target.value),
      placeholder: "E.g., Did 2 lakhs in Axis Home loans and 50k in GST filing...",
      className: "w-full h-24 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-500/20 rounded-md p-3 text-sm focus:outline-none focus:border-indigo-500/50 resize-none disabled:opacity-50 text-slate-900 dark:text-white"
    }
  ), /* @__PURE__ */ React.createElement(Button, { disabled: hasExistingEntry || isParsing || !smartPrompt.trim(), onClick: handleParse, className: "w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm" }, isParsing ? /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin w-4 h-4 mr-2" }) : "Extract Items from Text")))), /* @__PURE__ */ React.createElement(Card, { className: "lg:col-span-2 glass border-slate-900/10 dark:border-white/10 overflow-hidden flex flex-col h-[600px]" }, /* @__PURE__ */ React.createElement(CardHeader, { className: "border-b border-slate-900/10 dark:border-white/10 p-4 bg-slate-900/5 dark:bg-white/5 flex flex-row items-center justify-between" }, /* @__PURE__ */ React.createElement("h3", { className: "text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300 shrink-0" }, "Line Items"), hasExistingEntry && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-500/30 shrink-0" }, "Locked & Processed")), /* @__PURE__ */ React.createElement(CardContent, { className: "p-0 flex-1 overflow-auto" }, isLoadingExisting ? /* @__PURE__ */ React.createElement("div", { className: "flex justify-center items-center h-full" }, /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin text-slate-300" })) : /* @__PURE__ */ React.createElement(Table, null, /* @__PURE__ */ React.createElement(TableHeader, { className: "bg-slate-900/5 dark:bg-white/5 sticky top-0 z-10 box-border" }, /* @__PURE__ */ React.createElement(TableRow, null, /* @__PURE__ */ React.createElement(TableHead, { className: "text-[10px] font-bold uppercase" }, "Category"), /* @__PURE__ */ React.createElement(TableHead, { className: "text-[10px] font-bold uppercase" }, "Product"), /* @__PURE__ */ React.createElement(TableHead, { className: "text-[10px] font-bold uppercase" }, "Channel"), /* @__PURE__ */ React.createElement(TableHead, { className: "text-[10px] font-bold uppercase w-[120px]" }, "Amt (\u20B9)"), /* @__PURE__ */ React.createElement(TableHead, { className: "w-[50px]" }))), /* @__PURE__ */ React.createElement(TableBody, null, items.length === 0 ? /* @__PURE__ */ React.createElement(TableRow, null, /* @__PURE__ */ React.createElement(TableCell, { colSpan: 5, className: "text-center py-12 text-slate-500 text-[10px] uppercase tracking-widest" }, "No items formulated for ", dateStr)) : items.map((item, index) => /* @__PURE__ */ React.createElement(TableRow, { key: index, className: "hover:bg-slate-50 dark:hover:bg-white/5" }, /* @__PURE__ */ React.createElement(TableCell, { className: "p-2 align-top" }, /* @__PURE__ */ React.createElement(
    "select",
    {
      disabled: hasExistingEntry,
      className: "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2 text-xs rounded shadow-none text-slate-900 dark:text-slate-200 disabled:opacity-50",
      value: item.category,
      onChange: (e) => handleUpdateItem(index, "category", e.target.value)
    },
    /* @__PURE__ */ React.createElement("option", { value: "Loan" }, "Loan"),
    /* @__PURE__ */ React.createElement("option", { value: "Insurance" }, "Insurance"),
    /* @__PURE__ */ React.createElement("option", { value: "Forex" }, "Forex"),
    /* @__PURE__ */ React.createElement("option", { value: "Consultancy" }, "Consultancy")
  )), /* @__PURE__ */ React.createElement(TableCell, { className: "p-2 align-top" }, /* @__PURE__ */ React.createElement(
    "select",
    {
      disabled: hasExistingEntry,
      className: "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2 text-xs rounded shadow-none text-slate-900 dark:text-slate-200 disabled:opacity-50",
      value: item.product,
      onChange: (e) => handleUpdateItem(index, "product", e.target.value)
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "Select..."),
    allowedProducts(item.category).map((p) => /* @__PURE__ */ React.createElement("option", { key: p.id, value: p.name }, p.name))
  )), /* @__PURE__ */ React.createElement(TableCell, { className: "p-2 align-top" }, /* @__PURE__ */ React.createElement(
    "select",
    {
      disabled: hasExistingEntry,
      className: "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2 text-xs rounded shadow-none text-slate-900 dark:text-slate-200 disabled:opacity-50",
      value: item.channel,
      onChange: (e) => handleUpdateItem(index, "channel", e.target.value)
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "Select..."),
    channels.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.name }, c.name))
  )), /* @__PURE__ */ React.createElement(TableCell, { className: "p-2 align-top" }, /* @__PURE__ */ React.createElement(
    Input,
    {
      disabled: hasExistingEntry,
      type: "number",
      className: "h-[34px] text-xs bg-white dark:bg-slate-900 dark:border-white/10 dark:text-slate-100 disabled:opacity-50",
      value: item.amount === 0 ? "" : item.amount,
      onChange: (e) => handleUpdateItem(index, "amount", parseInt(e.target.value) || 0)
    }
  )), /* @__PURE__ */ React.createElement(TableCell, { className: "p-2 align-top text-right" }, !hasExistingEntry && /* @__PURE__ */ React.createElement("button", { onClick: () => handleRemoveItem(index), className: "text-slate-400 hover:text-red-500 pt-2 px-1" }, "\xD7"))))))), /* @__PURE__ */ React.createElement("div", { className: "border-t border-slate-900/10 dark:border-white/10 p-4 bg-slate-900/5 dark:bg-black/20 flex flex-col sm:flex-row justify-between items-center shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "w-full sm:w-auto mb-4 sm:mb-0" }, error && /* @__PURE__ */ React.createElement("span", { className: "text-xs text-red-500 font-bold" }, error), success && /* @__PURE__ */ React.createElement("span", { className: "text-xs text-emerald-500 font-bold" }, success)), /* @__PURE__ */ React.createElement("div", { className: "flex gap-3 w-full sm:w-auto" }, !hasExistingEntry && /* @__PURE__ */ React.createElement(Button, { variant: "outline", onClick: handleAddItem, className: "flex-1 sm:flex-none border-slate-900/20 dark:border-white/20 text-xs" }, "+ Manual Row"), /* @__PURE__ */ React.createElement(
    Button,
    {
      disabled: hasExistingEntry || isSaving || items.length === 0,
      onClick: handleSubmit,
      className: "bg-emerald-600 hover:bg-emerald-500 text-white flex-1 sm:flex-none"
    },
    isSaving ? /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin w-4 h-4 mr-2" }) : /* @__PURE__ */ React.createElement(Save, { className: "w-4 h-4 mr-2" }),
    "Permanently Lodge Record"
  ))))));
}
