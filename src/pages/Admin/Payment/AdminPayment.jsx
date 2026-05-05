import React, { useEffect, useState } from 'react';
import { Space } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import * as ClassQuery from '../../../data/Center/classQuery';
import ClassFilterBar from '../Classes/partials/ClassFilterBar';
import PaymentClassList from './partials/PaymentClassList';
import PaymentSummaryCards from './partials/PaymentSummaryCards';
import PaymentPrintAction from './partials/PaymentPrintAction';

export default function AdminPayment() {
  const [years, setYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const navigate = useNavigate();
  
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);

  useEffect(() => {
    const initializeData = async () => {
      const fetchedYears = await ClassQuery.getAllYears();
      setYears(fetchedYears);
      
      const currentYearStr = dayjs().year().toString();
      const matchedYear = fetchedYears.find(y => y.name === currentYearStr);
      
      if (matchedYear) {
        setSelectedYear(matchedYear);
        const fetchedTerms = await ClassQuery.getTermsByYear(matchedYear.id);
        setTerms(fetchedTerms);
        
        const currentMonthStr = `Tháng ${dayjs().month() + 1}`;
        const matchedTerm = fetchedTerms.find(t => t.name === currentMonthStr);
        if (matchedTerm) {
          setSelectedTerm(matchedTerm);
          const fetchedClasses = await ClassQuery.getClassesByTerm(matchedTerm.id);
          setClasses(fetchedClasses);
        }
      }
    };
    initializeData();
  }, []);

  const handleSelectYear = async (yearId) => {
    const year = years.find(y => y.id === yearId);
    setSelectedYear(year);
    setSelectedTerm(null);
    setClasses([]);
    setTerms(await ClassQuery.getTermsByYear(year.id));
  };

  const handleSelectTerm = async (termId) => {
    const term = terms.find(t => t.id === termId);
    setSelectedTerm(term);
    setClasses(await ClassQuery.getClassesByTerm(term.id));
  };

  return (
    <div>
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .print-hidden { display: none !important; }
            #printable-section, #printable-section * { visibility: visible; }
            #printable-section { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
            table { page-break-inside:auto; }
            tr    { page-break-inside:avoid; page-break-after:auto; }
          }
        `}
      </style>

      <div className="print-hidden">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2>Payment Administration</h2>
            <button
              onClick={() => navigate('/admin/payment/summary')}
              className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600 transition-colors" 
            >
              View Student Summary
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <ClassFilterBar
                years={years}
                terms={terms}
                selectedYear={selectedYear}
                selectedTerm={selectedTerm}
                handleSelectYear={handleSelectYear}
                handleSelectTerm={handleSelectTerm}
                isReadOnly={true}
              />
            </div>
            
            <PaymentPrintAction 
               classes={classes} 
               selectedTerm={selectedTerm} 
               selectedYear={selectedYear} 
            />
          </div>

          {/* Extracted Summary Cards */}
          <PaymentSummaryCards classes={classes} />

          {/* Class Extracted List */}
          <div>
            <PaymentClassList classes={classes} />
          </div>
        </Space>
      </div>
    </div>
  );
}