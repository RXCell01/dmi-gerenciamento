
import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const STORAGE_KEY = "dmi:vendas:v2";
const TARGET = 25000; // meta em reais

function moneyBR(value){
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function clamp(v,a=0,b=100){ return Math.min(Math.max(v,a),b); }

export default function App(){
  const [vendas, setVendas] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [form, setForm] = useState({ data: "", cliente: "", entrada: "", saida: "" });
  const today = new Date();
  const [filterMonth, setFilterMonth] = useState(`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`);

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
    if(!form.cliente || !form.data || (entrada===0 && saida===0)){
      alert("Preencha data, cliente e valores corretamente.");
      return;
    }
    const lucro = +(saida - entrada);
    const newItem = { id: Date.now(), data: form.data, cliente: form.cliente, entrada, saida, lucro };
    setVendas(s => [newItem, ...s]);
    setForm({ data: "", cliente: "", entrada: "", saida: "" });
  }

  const totalLucro = useMemo(()=> vendas.reduce((acc,v)=>acc + (Number(v.lucro)||0), 0), [vendas]);
  const faturamentoTotal = useMemo(()=> vendas.reduce((acc,v)=>acc + (Number(v.saida)||0), 0), [vendas]);
  const investimentoTotal = useMemo(()=> vendas.reduce((acc,v)=>acc + (Number(v.entrada)||0), 0), [vendas]);
  const percent = useMemo(()=> clamp((totalLucro / TARGET) * 100, 0, 100), [totalLucro]);

  // filter by month-year (YYYY-MM)
  const vendasDoMes = useMemo(()=> {
    const [y,m] = filterMonth.split("-").map(Number);
    return vendas.filter(v => {
      const d = new Date(v.data);
      return d.getFullYear() === y && (d.getMonth()+1) === m;
    });
  }, [vendas, filterMonth]);

  const lucroMes = useMemo(()=> vendasDoMes.reduce((acc,v)=>acc + (Number(v.lucro)||0),0), [vendasDoMes]);
  const faturamentoMes = useMemo(()=> vendasDoMes.reduce((acc,v)=>acc + (Number(v.saida)||0),0), [vendasDoMes]);
  const investimentoMes = useMemo(()=> vendasDoMes.reduce((acc,v)=>acc + (Number(v.entrada)||0),0), [vendasDoMes]);
  const percentMes = useMemo(()=> clamp((lucroMes / TARGET) * 100, 0, 100), [lucroMes]);

  const pieData = [
    { name: "Lucro Atual (mês)", value: Math.max(lucroMes, 0) },
    { name: "Meta Restante (mês)", value: Math.max(TARGET - lucroMes, 0) }
  ];
  const COLORS = ["#10b981", "#ef4444"];

  function exportCSV(filtered=false){
    const rowsSource = filtered ? vendasDoMes : vendas;
    if(!rowsSource.length) return alert("Sem vendas para exportar.");
    const header = ["data","cliente","entrada","saida","lucro"];
    const rows = rowsSource.map(r => [r.data, r.cliente, r.entrada, r.saida, r.lucro]);
    const csv = [header, ...rows].map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dmi_vendas_${filtered ? filterMonth : 'all'}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function removeItem(id){ if(!confirm("Remover esta venda?")) return; setVendas(s => s.filter(x=> x.id !== id)); }
  function clearAll(){ if(!confirm("Limpar todas as vendas?")) return setVendas([]); }

  // helper: list last 12 months for filter
  function monthsList(){
    const res = [];
    const now = new Date();
    for(let i=0;i<12;i++){
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      res.push({ key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label: `${d.toLocaleString('pt-BR', { month: 'long' })} ${d.getFullYear()}` });
    }
    return res;
  }

  return (
    <div className="container">
      <header>
        <h1>DMI Gerenciamento - Painel de Meta de Lucro (v2)</h1>
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
            <div className="sub">Lucro líquido total</div>
            <div className="big" style={{marginTop:8}}>{moneyBR(faturamentoTotal)}</div>
            <div className="sub">Faturamento total</div>
            <div className="sub small" style={{marginTop:8}}>Investido total: {moneyBR(investimentoTotal)}</div>
            <div className="progress" style={{marginTop:10}}>
              <div className="progress-bar" style={{width: percent + "%"}}></div>
            </div>
            <div className="sub small">{percent.toFixed(2)}% da meta ({moneyBR(totalLucro)} / {moneyBR(TARGET)})</div>
            <div className="actions">
              <button onClick={() => exportCSV(false)} className="btn">Exportar CSV (todas)</button>
              <button onClick={clearAll} className="btn red">Limpar</button>
            </div>
          </div>

          <div className="pie">
            <h3 style={{marginTop:0}}>Relatório Mensal</h3>
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #e2e8f0'}}>
              {monthsList().map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>

            <div style={{height:200, marginTop:12}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={80} label={({name, value}) => `${name}: ${moneyBR(value)} (${((value/TARGET)*100).toFixed(1)}%)`}>
                    {pieData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => moneyBR(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{marginTop:8}}>
              <div className="sub small">Lucro do mês: <strong>{moneyBR(lucroMes)}</strong></div>
              <div className="sub small">Faturamento do mês: <strong>{moneyBR(faturamentoMes)}</strong></div>
              <div className="sub small">Investido no mês: <strong>{moneyBR(investimentoMes)}</strong></div>
              <div className="sub small">Percentual da meta (mês): <strong>{percentMes.toFixed(2)}%</strong></div>
              <div style={{marginTop:8}}>
                <button onClick={() => exportCSV(true)} className="btn">Exportar CSV (mês)</button>
              </div>
            </div>
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
