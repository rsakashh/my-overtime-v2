import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Alert, StatusBar, SafeAreaView, Switch,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { BannerAd, BannerAdSize, TestIds, MobileAds } from 'react-native-google-mobile-ads';

const AD_UNIT_ID = __DEV__ ? TestIds.BANNER : 'ca-app-pub-6032254677631992/2093790495';

// ── File Storage ──────────────────────────────────────────────────────────────
const DATA_FILE = FileSystem.documentDirectory + 'myovertime_data.json';

const DEFAULT_DATA = {
  workers: [],
  records: [],
  calcState: {
    selId: null,
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    absent: '0',
    otList: [],
    nightList: [],
  }
};

async function readFile() {
  try {
    const info = await FileSystem.getInfoAsync(DATA_FILE);
    if (!info.exists) {
      await FileSystem.writeAsStringAsync(DATA_FILE, JSON.stringify(DEFAULT_DATA));
      return { ...DEFAULT_DATA };
    }
    const str = await FileSystem.readAsStringAsync(DATA_FILE);
    const data = JSON.parse(str);
    return {
      workers: Array.isArray(data.workers) ? data.workers : [],
      records: Array.isArray(data.records) ? data.records : [],
      calcState: data.calcState || DEFAULT_DATA.calcState,
    };
  } catch (e) {
    console.log('Read error:', e);
    return { ...DEFAULT_DATA };
  }
}

async function writeFile(data) {
  try {
    await FileSystem.writeAsStringAsync(DATA_FILE, JSON.stringify(data));
  } catch (e) {
    console.log('Write error:', e);
  }
}

// ── Global data cache ────────────────────────────────────────────────────────
let _cache = null;

async function getData() {
  if (!_cache) _cache = await readFile();
  return _cache;
}

async function updateData(partial) {
  const current = await getData();
  _cache = { ...current, ...partial };
  await writeFile(_cache);
}

// ── i18n ──────────────────────────────────────────────────────────────────────
const T = {
  bn: {
    appTitle: 'My Overtime',
    appSubtitle: 'বেতন · ওভারটাইম · নাইট বিল',
    lang: 'EN',
    tabs: ['👷 কর্মী', '💰 বেতন', '📊 রিপোর্ট'],
    addWorker: '+ নতুন কর্মী',
    workerName: 'কর্মীর নাম *',
    workerNamePh: 'নাম লিখুন',
    designation: 'পদবি',
    designationPh: 'যেমন: অপারেটর, হেলপার',
    basicSalary: 'বেসিক বেতন (৳) *',
    basicNote: 'কর্তন হার = বেসিক ÷ ৩০',
    grossSalary: 'গ্রস বেতন (৳) *',
    grossNote: 'বেসিক + সব ভাতা',
    workDays: 'কার্যদিবস',
    otAuto: 'স্বয়ংক্রিয় (গ্রস ÷ দিন ÷ ৮ × ২)',
    otManual: 'নিজে নির্ধারণ',
    otRatePh: 'ওভারটাইম রেট (৳/ঘন্টা)',
    nightRate: 'নাইট বিল (৳/দিন)',
    bonusSwitch: 'হাজিরা বোনাস চালু',
    bonusAmt: 'বোনাস পরিমাণ (৳)',
    bonusHint: 'অনুপস্থিতি ০ হলে স্বয়ংক্রিয় যোগ হবে',
    save: 'সংরক্ষণ',
    cancel: 'বাতিল',
    noWorkers: 'কোনো কর্মী নেই',
    selectWorker: 'কর্মী বেছে নিন',
    month: 'মাস',
    year: 'বছর',
    absent: 'অনুপস্থিত দিন',
    absentNote: 'কর্তন = বেসিক ÷ ৩০ × অনুপস্থিত',
    otSection: '⏱ ওভারটাইম এন্ট্রি',
    nightSection: '🌙 নাইট বিল এন্ট্রি',
    datePh: 'তারিখ (YYYY-MM-DD)',
    hoursPh: 'ঘন্টা',
    notePh: 'নোট (ঐচ্ছিক)',
    addBtn: 'যোগ',
    noOT: 'ওভারটাইম এন্ট্রি নেই',
    noNight: 'নাইট বিল এন্ট্রি নেই',
    calc: 'হিসাব করুন',
    reset: 'রিসেট',
    saveRecord: '💾 রেকর্ড সংরক্ষণ',
    summary: 'বেতন সারসংক্ষেপ',
    grossLbl: 'গ্রস বেতন',
    deductLbl: 'অনুপস্থিতি কর্তন',
    netLbl: 'নেট বেতন',
    otLbl: 'ওভারটাইম',
    nightLbl: 'নাইট বিল',
    bonusLbl: 'হাজিরা বোনাস',
    bonusYes: '✅ সম্পূর্ণ উপস্থিত',
    bonusNo: '❌ অনুপস্থিত — বোনাস নেই',
    total: 'সর্বমোট',
    savedMsg: '✅ সংরক্ষিত!',
    report: 'মাসভিত্তিক রিপোর্ট',
    noRecords: 'কোনো রেকর্ড নেই',
    monthTotal: 'মাসের মোট',
    confirmDel: 'মুছে ফেলবেন?',
    confirmDelAll: 'সব রেকর্ড মুছবেন?',
    yes: 'হ্যাঁ',
    no: 'না',
    months: ['জানু','ফেব্রু','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টে','অক্টো','নভে','ডিসে'],
    fullMonths: ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'],
    hrs: 'ঘন্টা', days: 'দিন', otRate: 'OT রেট',
    deductRate: 'কর্তন হার', selectFirst: 'প্রথমে কর্মী বেছে নিন',
    devBy: 'Developer: Aakash | aakash.water.blog',
    loading: 'লোড হচ্ছে...',
    otTotal: 'মোট OT',
    nightTotal: 'মোট নাইট',
    clearAll: 'সব মুছুন',
  },
  en: {
    appTitle: 'My Overtime',
    appSubtitle: 'Salary · Overtime · Night Bill',
    lang: 'বাংলা',
    tabs: ['👷 Workers', '💰 Salary', '📊 Report'],
    addWorker: '+ Add Worker',
    workerName: 'Worker Name *',
    workerNamePh: 'Enter name',
    designation: 'Designation',
    designationPh: 'e.g. Operator, Helper',
    basicSalary: 'Basic Salary (৳) *',
    basicNote: 'Deduction = Basic ÷ 30',
    grossSalary: 'Gross Salary (৳) *',
    grossNote: 'Basic + all allowances',
    workDays: 'Work Days',
    otAuto: 'Auto (gross ÷ days ÷ 8 × 2)',
    otManual: 'Set manually',
    otRatePh: 'OT Rate (৳/hr)',
    nightRate: 'Night Bill (৳/day)',
    bonusSwitch: 'Enable Attendance Bonus',
    bonusAmt: 'Bonus Amount (৳)',
    bonusHint: 'Auto-applied when absent = 0',
    save: 'Save',
    cancel: 'Cancel',
    noWorkers: 'No workers added',
    selectWorker: 'Select Worker',
    month: 'Month',
    year: 'Year',
    absent: 'Absent Days',
    absentNote: 'Deduction = Basic ÷ 30 × Absent',
    otSection: '⏱ Overtime Entries',
    nightSection: '🌙 Night Bill Entries',
    datePh: 'Date (YYYY-MM-DD)',
    hoursPh: 'Hours',
    notePh: 'Note (optional)',
    addBtn: 'Add',
    noOT: 'No overtime entries',
    noNight: 'No night bill entries',
    calc: 'Calculate',
    reset: 'Reset',
    saveRecord: '💾 Save Record',
    summary: 'Salary Summary',
    grossLbl: 'Gross Salary',
    deductLbl: 'Absence Deduction',
    netLbl: 'Net Salary',
    otLbl: 'Overtime Pay',
    nightLbl: 'Night Bill',
    bonusLbl: 'Attendance Bonus',
    bonusYes: '✅ Full attendance — Bonus!',
    bonusNo: '❌ Absent — No bonus',
    total: 'Grand Total',
    savedMsg: '✅ Saved!',
    report: 'Monthly Report',
    noRecords: 'No records found',
    monthTotal: 'Month Total',
    confirmDel: 'Delete this?',
    confirmDelAll: 'Delete all records?',
    yes: 'Yes',
    no: 'No',
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    fullMonths: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    hrs: 'hrs', days: 'days', otRate: 'OT Rate',
    deductRate: 'Deduct Rate', selectFirst: 'Select a worker first',
    devBy: 'Developer: Aakash | aakash.water.blog',
    loading: 'Loading...',
    otTotal: 'Total OT',
    nightTotal: 'Total Night',
    clearAll: 'Clear All',
  }
};

function fmt(n) {
  return Number(n || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Worker Form ───────────────────────────────────────────────────────────────
function WorkerForm({ t, initial, onSave, onCancel }) {
  const blank = { name: '', designation: '', basicSalary: '', grossSalary: '', workDays: '30', otType: 'auto', otManualRate: '', nightRatePerDay: '100', bonusEnabled: false, bonusAmt: '' };
  const [w, setW] = useState(initial ? { ...initial } : blank);
  const set = (k, v) => setW(p => ({ ...p, [k]: v }));

  const autoOt = w.grossSalary && w.workDays ? ((parseFloat(w.grossSalary) / (parseInt(w.workDays) || 30) / 8) * 2).toFixed(2) : null;
  const deductRate = w.basicSalary ? (parseFloat(w.basicSalary) / 30).toFixed(2) : null;

  return (
    <View style={S.formBox}>
      <View style={S.fRow}>
        <Text style={S.lbl}>{t.workerName}</Text>
        <TextInput style={S.inp} value={w.name} onChangeText={v => set('name', v)} placeholder={t.workerNamePh} placeholderTextColor="#94a3b8" />
      </View>
      <View style={S.fRow}>
        <Text style={S.lbl}>{t.designation}</Text>
        <TextInput style={S.inp} value={w.designation} onChangeText={v => set('designation', v)} placeholder={t.designationPh} placeholderTextColor="#94a3b8" />
      </View>

      <View style={S.salBox}>
        <View style={S.fRow}>
          <Text style={S.lbl}>{t.basicSalary}</Text>
          <TextInput style={[S.inp, { borderColor: '#fbbf24' }]} value={w.basicSalary} onChangeText={v => set('basicSalary', v)} keyboardType="numeric" placeholder="0" placeholderTextColor="#94a3b8" />
          <Text style={S.noteText}>{t.basicNote}</Text>
          {deductRate && <Text style={S.hintTag}>÷30 = ৳{deductRate}/{t.days}</Text>}
        </View>
        <View style={S.fRow}>
          <Text style={S.lbl}>{t.grossSalary}</Text>
          <TextInput style={[S.inp, { borderColor: '#34d399' }]} value={w.grossSalary} onChangeText={v => set('grossSalary', v)} keyboardType="numeric" placeholder="0" placeholderTextColor="#94a3b8" />
          <Text style={S.noteText}>{t.grossNote}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={S.lbl}>{t.workDays}</Text>
            <TextInput style={S.inp} value={w.workDays} onChangeText={v => set('workDays', v)} keyboardType="numeric" placeholderTextColor="#94a3b8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.lbl}>{t.nightRate}</Text>
            <TextInput style={S.inp} value={w.nightRatePerDay} onChangeText={v => set('nightRatePerDay', v)} keyboardType="numeric" placeholderTextColor="#94a3b8" />
          </View>
        </View>
      </View>

      <View style={S.otBox}>
        <TouchableOpacity style={S.radioRow} onPress={() => set('otType', 'auto')}>
          <View style={[S.radio, w.otType === 'auto' && S.radioOn]} />
          <Text style={S.radioTxt}>{t.otAuto}</Text>
          {w.otType === 'auto' && autoOt && <Text style={S.autoTag}>৳{autoOt}/hr</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={S.radioRow} onPress={() => set('otType', 'manual')}>
          <View style={[S.radio, w.otType === 'manual' && S.radioOn]} />
          <Text style={S.radioTxt}>{t.otManual}</Text>
        </TouchableOpacity>
        {w.otType === 'manual' && (
          <TextInput style={[S.inp, { marginTop: 8 }]} value={w.otManualRate} onChangeText={v => set('otManualRate', v)} keyboardType="numeric" placeholder={t.otRatePh} placeholderTextColor="#94a3b8" />
        )}
      </View>

      <View style={S.bonusBox}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[S.radioTxt, { color: '#15803d', fontWeight: '700' }]}>🏅 {t.bonusSwitch}</Text>
          <Switch value={w.bonusEnabled} onValueChange={v => set('bonusEnabled', v)} trackColor={{ false: '#e2e8f0', true: '#86efac' }} thumbColor={w.bonusEnabled ? '#16a34a' : '#94a3b8'} />
        </View>
        {w.bonusEnabled && (
          <>
            <Text style={[S.lbl, { marginTop: 8 }]}>{t.bonusAmt}</Text>
            <TextInput style={[S.inp, { borderColor: '#86efac' }]} value={w.bonusAmt} onChangeText={v => set('bonusAmt', v)} keyboardType="numeric" placeholder="0" placeholderTextColor="#94a3b8" />
            <Text style={S.noteText}>💡 {t.bonusHint}</Text>
          </>
        )}
      </View>

      <View style={S.btnRow}>
        {onCancel && <TouchableOpacity style={[S.btn, S.btnSec]} onPress={onCancel}><Text style={S.btnSecTxt}>{t.cancel}</Text></TouchableOpacity>}
        <TouchableOpacity style={[S.btn, S.btnPri]} onPress={() => {
          if (!w.name.trim() || !w.basicSalary || !w.grossSalary) {
            Alert.alert('', t.workerName.replace(' *', '') + ' & ' + t.basicSalary.replace(' *', '') + ' required');
            return;
          }
          onSave({ ...w, id: initial?.id || Date.now() });
        }}><Text style={S.btnPriTxt}>{t.save}</Text></TouchableOpacity>
      </View>
    </View>
  );
}

// ── Entry Form ────────────────────────────────────────────────────────────────
function EntryForm({ t, type, onAdd }) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [hours, setHours] = useState('');
  const [note, setNote] = useState('');
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
      <TextInput style={[S.inpSm, { flex: 1.5, minWidth: 120 }]} value={date} onChangeText={setDate} placeholder={t.datePh} placeholderTextColor="#94a3b8" />
      {type === 'ot' && <TextInput style={[S.inpSm, { flex: 0.8, minWidth: 70 }]} value={hours} onChangeText={setHours} keyboardType="numeric" placeholder={t.hoursPh} placeholderTextColor="#94a3b8" />}
      <TextInput style={[S.inpSm, { flex: 1, minWidth: 80 }]} value={note} onChangeText={setNote} placeholder={t.notePh} placeholderTextColor="#94a3b8" />
      <TouchableOpacity style={S.addBtn} onPress={() => {
        if (!date) return;
        if (type === 'ot' && !hours) return;
        onAdd({ date, hours: parseFloat(hours) || 0, note, id: Date.now() });
        setHours(''); setNote('');
      }}><Text style={S.addBtnTxt}>{t.addBtn}</Text></TouchableOpacity>
    </View>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState('bn');
  const t = T[lang];
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);

  // Workers
  const [workers, setWorkers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);

  // Calculator
  const [selId, setSelId] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [absent, setAbsent] = useState('0');
  const [otList, setOtList] = useState([]);
  const [nightList, setNightList] = useState([]);
  const [result, setResult] = useState(null);
  const [savedOk, setSavedOk] = useState(false);

  // Records
  const [records, setRecords] = useState([]);

  // Track data loaded state
  const [dataLoaded, setDataLoaded] = useState(false);

  // ── Initialize AdMob ──
  useEffect(() => {
    MobileAds().initialize().catch(() => {});
  }, []);

  // ── Load ALL data on mount ──
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await readFile();
        if (!mounted) return;
        if (Array.isArray(data.workers)) setWorkers(data.workers);
        if (Array.isArray(data.records)) setRecords(data.records);
        const cs = data.calcState;
        if (cs) {
          if (cs.selId != null) setSelId(cs.selId);
          if (cs.month != null) setMonth(cs.month);
          if (cs.year != null) setYear(cs.year);
          if (cs.absent != null) setAbsent(cs.absent);
          if (Array.isArray(cs.otList)) setOtList(cs.otList);
          if (Array.isArray(cs.nightList)) setNightList(cs.nightList);
        }
      } catch (e) {
        console.log('Load error:', e);
      } finally {
        if (mounted) {
          setLoading(false);
          setDataLoaded(true);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ── Save worker selection & period immediately ──
  useEffect(() => {
    if (!dataLoaded) return;
    updateData({ calcState: { selId, month, year, absent, otList, nightList } });
  }, [selId, month, year, absent, dataLoaded]);

  const selW = workers.find(w => w.id === selId);

  const saveWorker = w => {
    setWorkers(p => {
      const updated = p.find(x => x.id === w.id) ? p.map(x => x.id === w.id ? w : x) : [...p, w];
      updateData({ workers: updated });
      return updated;
    });
    setShowAdd(false);
    setEditId(null);
  };

  const deleteWorker = id => {
    Alert.alert('', t.confirmDel, [
      { text: t.no },
      { text: t.yes, style: 'destructive', onPress: () => setWorkers(p => {
        const updated = p.filter(w => w.id !== id);
        updateData({ workers: updated });
        return updated;
      })}
    ]);
  };

  const calculate = () => {
    if (!selW) return;
    const basic = parseFloat(selW.basicSalary) || 0;
    const gross = parseFloat(selW.grossSalary) || 0;
    const wDays = parseInt(selW.workDays) || 30;
    const absN = parseInt(absent) || 0;
    const nightRate = parseFloat(selW.nightRatePerDay) || 0;

    const perDayDeduct = basic / 30;
    const deduction = perDayDeduct * absN;
    const netSalary = gross - deduction;

    const otRate = selW.otType === 'manual' && selW.otManualRate
      ? parseFloat(selW.otManualRate)
      : (gross / wDays / 8) * 2;

    const totalOTHours = otList.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);
    const totalOTPay = otRate * totalOTHours;
    const totalNightDays = nightList.length;
    const totalNightPay = nightRate * totalNightDays;

    const bonusApplied = selW.bonusEnabled && absN === 0;
    const bonus = bonusApplied ? (parseFloat(selW.bonusAmt) || 0) : 0;
    const grandTotal = netSalary + totalOTPay + totalNightPay + bonus;

    setResult({ basic, gross, perDayDeduct, deduction, netSalary, otRate, totalOTHours, totalOTPay, totalNightDays, totalNightPay, bonusApplied, bonus, grandTotal });
    setSavedOk(false);
  };

  const resetCalc = () => {
    const defaultCalc = {
      selId: null, month: new Date().getMonth(),
      year: new Date().getFullYear(), absent: '0',
      otList: [], nightList: []
    };
    setSelId(null); setAbsent('0'); setOtList([]); setNightList([]);
    setMonth(new Date().getMonth()); setYear(new Date().getFullYear());
    setResult(null); setSavedOk(false);
    updateData({ calcState: defaultCalc });
  };

  const saveRecord = () => {
    if (!result || !selW) return;
    const rec = {
      id: Date.now(),
      worker: { ...selW },
      month, year, absent,
      otList: [...otList],
      nightList: [...nightList],
      ...result
    };
    setRecords(p => {
      const updated = [rec, ...p];
      updateData({ records: updated });
      return updated;
    });
    setSavedOk(true);
  };

  const grouped = records.reduce((a, r) => {
    const k = `${t.fullMonths[r.month]} ${r.year}`;
    a[k] = a[k] || [];
    a[k].push(r);
    return a;
  }, {});

  const tabColors = ['#059669', '#1d4ed8', '#d97706'];
  const tabBg = ['#dcfce7', '#dbeafe', '#fef3c7'];
  const tabTxt = ['#065f46', '#1e40af', '#92400e'];

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f4ff' }}>
        <Text style={{ fontSize: 48 }}>⏱</Text>
        <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 16 }} />
        <Text style={{ marginTop: 12, color: '#64748b', fontSize: 15 }}>{t.loading}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={S.root}>
      <StatusBar backgroundColor="#0f3460" barStyle="light-content" />

      {/* Header */}
      <View style={S.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 28, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 26, backgroundColor: 'rgba(255,255,255,0.15)', padding: 7, borderRadius: 12 }}>⏱</Text>
            <View>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{t.appTitle}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{t.appSubtitle}</Text>
            </View>
          </View>
          <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }} onPress={() => setLang(l => l === 'bn' ? 'en' : 'bn')}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{t.lang}</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', gap: 8, padding: 10, paddingTop: 4 }}>
          {t.tabs.map((name, i) => (
            <TouchableOpacity key={i} style={{
              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              borderRadius: 12, paddingVertical: 9,
              backgroundColor: tab === i ? tabColors[i] : tabBg[i],
              borderWidth: 1.5, borderColor: tab === i ? tabColors[i] : tabColors[i],
              elevation: tab === i ? 4 : 0,
            }} onPress={() => setTab(i)}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: tab === i ? '#fff' : tabTxt[i] }}>{name}</Text>
              {i === 0 && workers.length > 0 && (
                <View style={{ backgroundColor: tab === i ? 'rgba(255,255,255,0.3)' : tabColors[i], borderRadius: 99, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 4 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{workers.length}</Text>
                </View>
              )}
              {i === 2 && records.length > 0 && (
                <View style={{ backgroundColor: tab === i ? 'rgba(255,255,255,0.3)' : tabColors[i], borderRadius: 99, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 4 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{records.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── TAB 0: Workers ── */}
      {tab === 0 && (
        <ScrollView style={S.main} showsVerticalScrollIndicator={false}>
          <View style={S.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={S.cardTitle}>👷 {lang === 'bn' ? 'কর্মী তালিকা' : 'Workers'}</Text>
              {!showAdd && !editId && (
                <TouchableOpacity style={S.greenBtn} onPress={() => setShowAdd(true)}>
                  <Text style={S.greenBtnTxt}>{t.addWorker}</Text>
                </TouchableOpacity>
              )}
            </View>
            {showAdd && <WorkerForm t={t} onSave={saveWorker} onCancel={() => setShowAdd(false)} />}
            {workers.length === 0 && !showAdd && (
              <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
                <Text style={{ fontSize: 48 }}>👷</Text>
                <Text style={{ color: '#64748b', fontSize: 14 }}>{t.noWorkers}</Text>
                <TouchableOpacity style={S.greenBtn} onPress={() => setShowAdd(true)}>
                  <Text style={S.greenBtnTxt}>{t.addWorker}</Text>
                </TouchableOpacity>
              </View>
            )}
            {workers.map(w => (
              <View key={w.id}>
                {editId === w.id
                  ? <WorkerForm t={t} initial={w} onSave={saveWorker} onCancel={() => setEditId(null)} />
                  : (
                    <View style={S.wCard}>
                      <View style={S.avatar}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>{w.name.charAt(0).toUpperCase()}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#1e293b' }}>{w.name}</Text>
                        {!!w.designation && <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>{w.designation}</Text>}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                          <Chip label={`বেসিক ৳${fmt(w.basicSalary)}`} bg="#fef3c7" tc="#92400e" />
                          <Chip label={`গ্রস ৳${fmt(w.grossSalary)}`} bg="#dcfce7" tc="#15803d" />
                          <Chip label={`🌙৳${w.nightRatePerDay}`} bg="#ede9fe" tc="#5b21b6" />
                          {w.bonusEnabled && !!w.bonusAmt && <Chip label={`🏅৳${w.bonusAmt}`} bg="#ecfdf5" tc="#065f46" />}
                        </View>
                      </View>
                      <View style={{ gap: 6 }}>
                        <TouchableOpacity style={[S.iconBtn, { backgroundColor: '#dbeafe' }]} onPress={() => { setEditId(w.id); setShowAdd(false); }}><Text>✏️</Text></TouchableOpacity>
                        <TouchableOpacity style={[S.iconBtn, { backgroundColor: '#fee2e2' }]} onPress={() => deleteWorker(w.id)}><Text>🗑</Text></TouchableOpacity>
                      </View>
                    </View>
                  )
                }
              </View>
            ))}
          </View>
          <Footer t={t} />
        </ScrollView>
      )}

      {/* ── TAB 1: Calculator ── */}
      {tab === 1 && (
        <ScrollView style={S.main} showsVerticalScrollIndicator={false}>
          {/* Worker & Period */}
          <View style={S.card}>
            <Text style={S.cardTitle}>📋 {lang === 'bn' ? 'তথ্য প্রদান' : 'Enter Details'}</Text>
            <Text style={S.lbl}>{t.selectWorker}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                {workers.length === 0
                  ? <Text style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 13 }}>{lang === 'bn' ? 'প্রথমে কর্মী যোগ করুন' : 'Add workers first'}</Text>
                  : workers.map(w => (
                    <TouchableOpacity key={w.id}
                      style={[S.wChip, selId === w.id && S.wChipOn]}
                      onPress={() => { setSelId(w.id); setResult(null); setSavedOk(false); }}>
                      <Text style={[{ fontSize: 13, fontWeight: '700', color: '#374151' }, selId === w.id && { color: '#fff' }]}>{w.name}</Text>
                    </TouchableOpacity>
                  ))
                }
              </View>
            </ScrollView>

            {/* Month */}
            <Text style={S.lbl}>{t.month}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 4 }}>
                {t.months.map((m, i) => (
                  <TouchableOpacity key={i}
                    style={[S.mChip, month === i && S.mChipOn]}
                    onPress={() => { setMonth(i); setResult(null); }}>
                    <Text style={[{ fontSize: 11, fontWeight: '700', color: '#374151' }, month === i && { color: '#fff' }]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={S.lbl}>{t.year}</Text>
                <TextInput style={S.inp} value={String(year)} onChangeText={v => { setYear(parseInt(v) || year); setResult(null); }} keyboardType="numeric" placeholderTextColor="#94a3b8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.lbl}>{t.absent}</Text>
                <TextInput style={[S.inp, { borderColor: '#fca5a5' }]} value={absent} onChangeText={v => { setAbsent(v); setResult(null); }} keyboardType="numeric" placeholderTextColor="#94a3b8" />
              </View>
            </View>
            <Text style={{ fontSize: 11, color: '#dc2626', marginBottom: 8 }}>⚠️ {t.absentNote}</Text>

            {selW && (
              <View style={{ backgroundColor: '#eff6ff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#bfdbfe', gap: 3 }}>
                <Text style={{ fontSize: 12, color: '#1e40af' }}>👷 <Text style={{ fontWeight: '700' }}>{selW.name}</Text></Text>
                <Text style={{ fontSize: 12, color: '#1e40af' }}>📌 বেসিক: ৳{fmt(selW.basicSalary)} | 💵 গ্রস: ৳{fmt(selW.grossSalary)}</Text>
                <Text style={{ fontSize: 12, color: '#dc2626' }}>🔻 {t.deductRate}: ৳{(parseFloat(selW.basicSalary) / 30).toFixed(2)}/{t.days}</Text>
                <Text style={{ fontSize: 12, color: '#1e40af' }}>⏱ {t.otRate}: {selW.otType === 'manual' ? `৳${selW.otManualRate}/hr` : `Auto ৳${((parseFloat(selW.grossSalary) / (parseInt(selW.workDays) || 30) / 8) * 2).toFixed(2)}/hr`} | 🌙 ৳{selW.nightRatePerDay}/{t.days}</Text>
                {selW.bonusEnabled && <Text style={{ fontSize: 12, color: '#15803d' }}>🏅 ৳{selW.bonusAmt} {parseInt(absent) === 0 ? '✅' : '❌'}</Text>}
              </View>
            )}
          </View>

          {/* OT */}
          <View style={S.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={[S.cardTitle, { color: '#d97706' }]}>{t.otSection}</Text>
              {otList.length > 0 && <View style={{ backgroundColor: '#fef3c7', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}><Text style={{ fontSize: 11, fontWeight: '700', color: '#92400e' }}>{t.otTotal}: {otList.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0)} {t.hrs}</Text></View>}
            </View>
            {!selId ? <Text style={S.hintTxt}>{t.selectFirst}</Text> : (
              <>
                <EntryForm t={t} type="ot" onAdd={e => {
                  setOtList(p => {
                    const updated = [...p, e];
                    updateData({ calcState: { selId, month, year, absent, otList: updated, nightList } });
                    return updated;
                  });
                  setResult(null);
                }} />
                {otList.length === 0 ? <Text style={S.hintTxt}>{t.noOT}</Text> :
                  [...otList].sort((a, b) => a.date > b.date ? 1 : -1).map(e => (
                    <View key={e.id} style={S.eRow}>
                      <Text style={S.eDate}>{e.date}</Text>
                      <Text style={[S.eHrs, { color: '#d97706' }]}>{e.hours} {t.hrs}</Text>
                      <Text style={S.eNote}>{e.note}</Text>
                      <TouchableOpacity onPress={() => {
                    setOtList(p => {
                      const updated = p.filter(x => x.id !== e.id);
                      updateData({ calcState: { selId, month, year, absent, otList: updated, nightList } });
                      return updated;
                    });
                    setResult(null);
                  }}><Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 14 }}>✕</Text></TouchableOpacity>
                    </View>
                  ))
                }
              </>
            )}
          </View>

          {/* Night */}
          <View style={S.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={[S.cardTitle, { color: '#7c3aed' }]}>{t.nightSection}</Text>
              {nightList.length > 0 && <View style={{ backgroundColor: '#ede9fe', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}><Text style={{ fontSize: 11, fontWeight: '700', color: '#5b21b6' }}>{t.nightTotal}: {nightList.length} {t.days}</Text></View>}
            </View>
            {!selId ? <Text style={S.hintTxt}>{t.selectFirst}</Text> : (
              <>
                <EntryForm t={t} type="night" onAdd={e => {
                  setNightList(p => {
                    const updated = [...p, e];
                    updateData({ calcState: { selId, month, year, absent, otList, nightList: updated } });
                    return updated;
                  });
                  setResult(null);
                }} />
                {nightList.length === 0 ? <Text style={S.hintTxt}>{t.noNight}</Text> :
                  [...nightList].sort((a, b) => a.date > b.date ? 1 : -1).map(e => (
                    <View key={e.id} style={[S.eRow, { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }]}>
                      <Text style={S.eDate}>{e.date}</Text>
                      <Text style={[S.eHrs, { color: '#7c3aed' }]}>🌙</Text>
                      <Text style={S.eNote}>{e.note}</Text>
                      <TouchableOpacity onPress={() => {
                    setNightList(p => {
                      const updated = p.filter(x => x.id !== e.id);
                      updateData({ calcState: { selId, month, year, absent, otList, nightList: updated } });
                      return updated;
                    });
                    setResult(null);
                  }}><Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 14 }}>✕</Text></TouchableOpacity>
                    </View>
                  ))
                }
              </>
            )}
          </View>

          <View style={S.btnRow}>
            <TouchableOpacity style={[S.btn, S.btnSec]} onPress={resetCalc}><Text style={S.btnSecTxt}>{t.reset}</Text></TouchableOpacity>
            <TouchableOpacity style={[S.btn, S.btnPri, { opacity: selId ? 1 : 0.5 }]} onPress={calculate}><Text style={S.btnPriTxt}>{t.calc}</Text></TouchableOpacity>
          </View>

          {result && (
            <View style={S.resultCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={[S.cardTitle, { marginBottom: 0 }]}>💰 {t.summary}</Text>
                <View style={{ backgroundColor: '#dbeafe', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 3 }}><Text style={{ fontSize: 12, fontWeight: '600', color: '#1d4ed8' }}>{selW?.name}</Text></View>
              </View>
              <Text style={{ fontSize: 12, color: '#6366f1', fontWeight: '600', marginBottom: 12 }}>{t.fullMonths[month]}, {year}</Text>

              <RRow label={t.grossLbl} val={`৳ ${fmt(result.gross)}`} c="#10b981" bg="#f0fdf4" />
              {result.deduction > 0 && (
                <View style={{ backgroundColor: '#fff7ed', borderRadius: 10, padding: 10, marginBottom: 7, borderWidth: 1.5, borderColor: '#fed7aa' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#c2410c', marginBottom: 4 }}>🔻 {t.deductLbl} ({absent} {t.days})</Text>
                  <Text style={{ fontSize: 12, color: '#7c2d12' }}>৳{fmt(result.basic)} ÷ ৩০ = ৳{fmt(result.perDayDeduct)}/{t.days} × {absent} = <Text style={{ color: '#dc2626', fontWeight: '800' }}>-৳{fmt(result.deduction)}</Text></Text>
                </View>
              )}
              <RRow label={t.netLbl} val={`৳ ${fmt(result.netSalary)}`} c="#2563eb" bg="#eff6ff" />
              {result.totalOTPay > 0 && <RRow label={`${t.otLbl} (${result.totalOTHours} ${t.hrs} × ৳${fmt(result.otRate)})`} val={`+ ৳ ${fmt(result.totalOTPay)}`} c="#d97706" bg="#fffbeb" />}
              {result.totalNightPay > 0 && <RRow label={`${t.nightLbl} (${result.totalNightDays} ${t.days} × ৳${selW?.nightRatePerDay})`} val={`+ ৳ ${fmt(result.totalNightPay)}`} c="#7c3aed" bg="#f5f3ff" />}
              {selW?.bonusEnabled && (
                <View style={{ borderRadius: 10, padding: 10, marginBottom: 7, borderWidth: 1.5, backgroundColor: result.bonusApplied ? '#f0fdf4' : '#fef2f2', borderColor: result.bonusApplied ? '#86efac' : '#fca5a5' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: result.bonusApplied ? '#15803d' : '#dc2626' }}>🏅 {t.bonusLbl}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: result.bonusApplied ? '#15803d' : '#dc2626' }}>{result.bonusApplied ? `+ ৳${fmt(result.bonus)}` : '৳0.00'}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: result.bonusApplied ? '#15803d' : '#dc2626', marginTop: 2 }}>{result.bonusApplied ? t.bonusYes : t.bonusNo}</Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e3a5f', borderRadius: 14, padding: 16, marginTop: 4 }}>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{t.total}</Text>
                  <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900' }}>৳ {fmt(result.grandTotal)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{t.fullMonths[month]}, {year}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{selW?.name}</Text>
                </View>
              </View>

              {!savedOk
                ? <TouchableOpacity style={[S.btn, { backgroundColor: '#10b981', marginTop: 12, elevation: 3 }]} onPress={saveRecord}><Text style={S.btnPriTxt}>{t.saveRecord}</Text></TouchableOpacity>
                : <View style={{ backgroundColor: '#d1fae5', borderRadius: 10, padding: 10, marginTop: 12, alignItems: 'center' }}><Text style={{ color: '#059669', fontWeight: '700', fontSize: 14 }}>{t.savedMsg}</Text></View>
              }
            </View>
          )}
          <Footer t={t} />
        </ScrollView>
      )}

      {/* ── TAB 2: Report ── */}
      {tab === 2 && (
        <ScrollView style={S.main} showsVerticalScrollIndicator={false}>
          <View style={S.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={S.cardTitle}>📊 {t.report}</Text>
              {records.length > 0 && (
                <TouchableOpacity style={[S.iconBtn, { backgroundColor: '#fee2e2', paddingHorizontal: 10 }]}
                  onPress={() => Alert.alert('', t.confirmDelAll, [
                    { text: t.no },
                    { text: t.yes, style: 'destructive', onPress: () => { setRecords([]); updateData({ records: [] }); } }
                  ])}>
                  <Text style={{ color: '#dc2626', fontWeight: '700', fontSize: 12 }}>🗑 {t.clearAll}</Text>
                </TouchableOpacity>
              )}
            </View>
            {records.length === 0
              ? <View style={{ alignItems: 'center', paddingVertical: 40 }}><Text style={{ fontSize: 48 }}>📂</Text><Text style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>{t.noRecords}</Text></View>
              : Object.entries(grouped).map(([period, recs]) => (
                <View key={period} style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: '#e8edf5', marginBottom: 10 }}>{period}</Text>
                  {recs.map(r => (
                    <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f8fafc', borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e8edf5' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 2 }}>{r.worker.name}</Text>
                        {!!r.worker.designation && <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{r.worker.designation}</Text>}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                          <Chip label={`গ্রস ৳${fmt(r.gross)}`} bg="#dbeafe" tc="#1d4ed8" />
                          {r.deduction > 0 && <Chip label={`কর্তন -৳${fmt(r.deduction)}`} bg="#fee2e2" tc="#dc2626" />}
                          <Chip label={`নেট ৳${fmt(r.netSalary)}`} bg="#dcfce7" tc="#15803d" />
                          {r.totalOTPay > 0 && <Chip label={`⏱ ${r.totalOTHours}ঘন্টা +৳${fmt(r.totalOTPay)}`} bg="#fef3c7" tc="#92400e" />}
                          {r.totalNightPay > 0 && <Chip label={`🌙 ${r.totalNightDays}দিন +৳${fmt(r.totalNightPay)}`} bg="#ede9fe" tc="#5b21b6" />}
                          {r.bonusApplied && <Chip label={`🏅 বোনাস +৳${fmt(r.bonus)}`} bg="#ecfdf5" tc="#065f46" />}
                          <Chip label={`অনুপস্থিত: ${r.absent}দিন`} bg="#f1f5f9" tc="#475569" />
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#1e3a5f' }}>৳{fmt(r.grandTotal)}</Text>
                        <TouchableOpacity style={[S.iconBtn, { backgroundColor: '#fee2e2' }]} onPress={() => setRecords(p => {
                          const updated = p.filter(x => x.id !== r.id);
                          updateData({ records: updated });
                          return updated;
                        })}><Text>🗑</Text></TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#eff6ff', borderRadius: 10, borderWidth: 1, borderColor: '#bfdbfe', borderStyle: 'dashed' }}>
                    <Text style={{ color: '#475569', fontSize: 13 }}>{t.monthTotal}:</Text>
                    <Text style={{ color: '#1e3a5f', fontWeight: '800', fontSize: 16 }}>৳{fmt(recs.reduce((s, r) => s + r.grandTotal, 0))}</Text>
                  </View>
                </View>
              ))
            }
          </View>
          <Footer t={t} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Chip({ label, bg, tc }) {
  return <View style={{ backgroundColor: bg, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}><Text style={{ fontSize: 11, fontWeight: '600', color: tc }}>{label}</Text></View>;
}

function RRow({ label, val, c, bg }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: bg, borderRadius: 9, marginBottom: 7, borderWidth: 1, borderColor: '#e8edf5' }}>
      <Text style={{ fontSize: 12, color: '#475569', flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '800', color: c }}>{val}</Text>
    </View>
  );
}

function AdBanner() {
  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <BannerAd
        unitId={AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={(err) => console.log('Ad failed:', err)}
      />
    </View>
  );
}

function Footer({ t }) {
  return (
    <View style={{ alignItems: 'center', paddingBottom: 20, marginBottom: 10 }}>
      <AdBanner />
      <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>{t.devBy}</Text>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f4ff' },
  header: { backgroundColor: '#0f3460', elevation: 8, shadowColor: '#0f3460', shadowOpacity: 0.3, shadowRadius: 8 },
  main: { flex: 1, paddingHorizontal: 13, paddingTop: 14 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 14, elevation: 3, shadowColor: '#1e3a5f', shadowOpacity: 0.07, shadowRadius: 8 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1e3a5f', marginBottom: 12 },
  formBox: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: '#e2e8f0' },
  salBox: { backgroundColor: '#fffbeb', borderRadius: 12, padding: 12, marginTop: 8, marginBottom: 8, borderWidth: 1.5, borderColor: '#fde68a' },
  otBox: { backgroundColor: '#f0f9ff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1.5, borderColor: '#bae6fd' },
  bonusBox: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: '#86efac' },
  fRow: { marginBottom: 10 },
  lbl: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 4 },
  inp: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 9, padding: 10, fontSize: 14, color: '#1e293b', backgroundColor: '#f8fafc' },
  inpSm: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 8, fontSize: 13, color: '#1e293b', backgroundColor: '#f8fafc' },
  noteText: { fontSize: 10, color: '#64748b', marginTop: 3 },
  hintTag: { fontSize: 11, fontWeight: '700', color: '#d97706', backgroundColor: '#fef3c7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4, alignSelf: 'flex-start' },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#94a3b8' },
  radioOn: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  radioTxt: { fontSize: 13, color: '#374151', flex: 1 },
  autoTag: { backgroundColor: '#dcfce7', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, fontSize: 11, fontWeight: '700', color: '#15803d' },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  btn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnPri: { flex: 2, backgroundColor: '#2563eb', elevation: 4, shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 6 },
  btnPriTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnSec: { flex: 1, backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: '#e2e8f0' },
  btnSecTxt: { color: '#475569', fontWeight: '600', fontSize: 14 },
  greenBtn: { backgroundColor: '#10b981', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, elevation: 3 },
  greenBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  addBtn: { backgroundColor: '#2563eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  addBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  iconBtn: { borderRadius: 8, padding: 7, alignItems: 'center', justifyContent: 'center' },
  wCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#f8fafc', borderRadius: 13, marginBottom: 10, borderWidth: 1, borderColor: '#e8edf5' },
  avatar: { width: 42, height: 42, backgroundColor: '#2563eb', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  wChip: { backgroundColor: '#f1f5f9', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: '#e2e8f0' },
  wChipOn: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  mChip: { backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  mChipOn: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  eRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', borderRadius: 9, padding: 8, marginBottom: 6, borderWidth: 1, borderColor: '#d1fae5' },
  eDate: { fontSize: 12, fontWeight: '700', color: '#1e293b', flex: 1.2 },
  eHrs: { fontSize: 12, fontWeight: '700', flex: 0.8 },
  eNote: { fontSize: 11, color: '#64748b', flex: 1 },
  hintTxt: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginVertical: 4 },
  resultCard: { backgroundColor: '#eef2ff', borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1.5, borderColor: '#c7d2fe', elevation: 4 },
});
