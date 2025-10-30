import React, { useEffect, useMemo, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const STORAGE_KEY = "dmi:vendas";
const TARGET = 30000; // meta em reais

function moneyBR(value){
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function clamp(v,a=0,b=100){ return Math.min(Math.max(v,a),b); }

export default function App(){
  const [vendas, setVendas] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [form, setForm] = useState({ data: "", cliente: "", entrada: "", saida: "" });

  useEffect(()=>{ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(vendas)); }catch{} },[vendas]);

  function parseNumberInput(s){
    if(s === null || s === undefined) return 0;
    const cleaned = String(s).replace(/[^0-9,.-]/g,"").replace(",", ".");
    const n = Number(cleaned);
    return isNaN(n) ? 0 : n;
  }

  function addVenda(e){
    e?.preventDefault?.();
    const entrada = parseNumberInput(form.entrada);
    const saida = parseNumberInput(form.saida);
    if(!form.cliente || !form.data || entrada===0 && saida===0){
      alert("Preencha data, cliente e valores corretamente.");
      return;
    }
    const lucro = +(saida - entrada);
    const newItem = { id: Date.now(), data: form.data, cliente: form.cliente, entrada, saida, lucro };
    setVendas(s => [newItem, ...s]);
    setForm({ data: "", cliente: "", entrada: "", saida: "" });
  }

  const totalLucro = useMemo(()=> vendas.reduce((acc,v)=>acc + (Number(v.lucro)||0), 0), [vendas]);
  const percent = useMemo(()=> clamp((totalLucro / TARGET) * 100, 0, 100), [totalLucro]);

  const pieData = [
    { name: "Lucro Atual", value: Math.max(totalLucro, 0) },
    { name: "Meta Restante", value: Math.max(TARGET - totalLucro, 0) }
  ];
  const COLORS = ["#10b981", "#ef4444"];

  function exportCSV(){
    if(!vendas.length) return alert("Sem vendas para exportar.");
    const header = ["data","cliente","entrada","saida","lucro"];
    const rows = vendas.map(r => [r.data, r.cliente, r.entrada, r.saida, r.lucro]);
    const csv = [header, ...rows].map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dmi_vendas_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function removeItem(id){ if(!confirm("Remover esta venda?")) return; setVendas(s => s.filter(x=> x.id !== id)); }
  function clearAll(){ if(!confirm("Limpar todas as vendas?")) return setVendas([]); }

  return (
    <div className="container">
      <header>
        <h1>DMI Gerenciamento - Painel de Meta de Lucro</h1>
        <div className="meta">Meta mensal: <strong>{moneyBR(TARGET)}</strong></div>
      </header>

      <section className="top">
        <form className="form" onSubmit={addVenda}>
          <input type="date" value={form.data} onChange={e => setForm(f=>({...f, data: e.target.value}))} />
          <input placeholder="Cliente" value={form.cliente} onChange={e => setForm(f=>({...f, cliente: e.target.value}))} />
          <input placeholder="Entrada (ex: 1200.50)" value={form.entrada} onChange={e => setForm(f=>({...f, entrada: e.target.value}))} />
          <input placeholder="Saída (ex: 1500.00)" value={form.saida} onChange={e => setForm(f=>({...f, saida: e.target.value}))} />
          <button type="submit" className="btn">Adicionar Venda</button>
        </form>

        <div className="stats-and-pie">
          <div className="stats">
            <div className="big">{moneyBR(totalLucro)}</div>
            <div className="sub">Lucro acumulado</div>
            <div className="progress">
              <div className="progress-bar" style={{width: percent + "%"}}></div>
            </div>
            <div className="sub small">{percent.toFixed(2)}% da meta ({moneyBR(totalLucro)} / {moneyBR(TARGET)})</div>
            <div className="actions">
              <button onClick={exportCSV} className="btn">Exportar CSV</button>
              <button onClick={clearAll} className="btn red">Limpar</button>
            </div>
          </div>

          <div className="pie">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={80} label={({name, value}) => `${name}: ${moneyBR(value)} (${((value/TARGET)*100).toFixed(1)}%)`}>
                  {pieData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => moneyBR(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="table-section">
        <h2>Vendas ({vendas.length})</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Data</th><th>Cliente</th><th>Entrada</th><th>Saída</th><th>Lucro</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {vendas.map(v => (
                <tr key={v.id}>
                  <td>{v.data}</td>
                  <td>{v.cliente}</td>
                  <td>{moneyBR(v.entrada)}</td>
                  <td>{moneyBR(v.saida)}</td>
                  <td className={v.lucro>=0? 'positive':'negative'}>{moneyBR(v.lucro)}</td>
                  <td><button className="link" onClick={()=>removeItem(v.id)}>Remover</button></td>
                </tr>
              ))}
              {!vendas.length && <tr><td colSpan="6" className="empty">Nenhuma venda registrada.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <footer>Desenvolvido para DMI Gerenciamento • Meta: {moneyBR(TARGET)}</footer>
    </div>
  );
}
