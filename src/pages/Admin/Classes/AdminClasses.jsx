// src/pages/Admin/Classes/AdminClasses.jsx
import React, { useEffect, useState } from 'react';
import { Space, Typography, message, Form } from 'antd';
import dayjs from 'dayjs';
import * as ClassQuery from '../../../data/Center/classQuery';
import { getAllUsers } from '../../../data/Users/userQuery';
import { getGrades, getSubjects } from '../../../data/Center/sectionQuery';

import ClassFilterBar from './partials/ClassFilterBar';
import ClassBoard from './partials/ClassBoard';
import ClassActionModal from './partials/ClassActionModal';

const { Title } = Typography;

export default function AdminClasses() {
  const [years, setYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [teachers, setTeachers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeGrade, setActiveGrade] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'year', 'term', 'class'
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState('');
  
  const [form] = Form.useForm();

  // Initialize data and perform auto-selection
  useEffect(() => {
    const initializeData = async () => {
      // Fetch core data in parallel
      const [fetchedYears, allUsers, fetchedGrades, fetchedSubjects] = await Promise.all([
        ClassQuery.getAllYears(),
        getAllUsers(),
        getGrades(),
        getSubjects()
      ]);

      setYears(fetchedYears);
      setTeachers(allUsers.filter(u => u.role === 'Teacher'));
      setGrades(fetchedGrades);
      setSubjects(fetchedSubjects);

      // --- AUTO-SELECT LOGIC ---
      const currentYearStr = dayjs().year().toString(); // e.g., "2026"
      const matchedYear = fetchedYears.find(y => y.name === currentYearStr);

      if (matchedYear) {
        setSelectedYear(matchedYear);
        const fetchedTerms = await ClassQuery.getTermsByYear(matchedYear.id);
        setTerms(fetchedTerms);

        const currentMonthStr = `Tháng ${dayjs().month() + 1}`; // e.g., "Tháng 3"
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

  // --- Manual Fetchers for Refreshes ---
  const fetchYears = async () => setYears(await ClassQuery.getAllYears());
  const fetchTerms = async (yearId) => setTerms(await ClassQuery.getTermsByYear(yearId));
  const fetchClasses = async (termId) => setClasses(await ClassQuery.getClassesByTerm(termId));

  // --- Handlers ---
  const handleSelectYear = async (yearId) => {
    const year = years.find(y => y.id === yearId);
    setSelectedYear(year);
    setSelectedTerm(null);
    setClasses([]);
    setActiveSubject(null);
    setActiveGrade(null);
    
    setTerms(await ClassQuery.getTermsByYear(year.id));
  };

  const handleSelectTerm = async (termId) => {
    const term = terms.find(t => t.id === termId);
    setSelectedTerm(term);
    setActiveSubject(null);
    setActiveGrade(null);
    
    setClasses(await ClassQuery.getClassesByTerm(term.id));
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setItemName(item ? item.name : '');

    if (type === 'class') {
      if (item) {
        form.setFieldsValue({
          ...item,
          dates: [dayjs(item.startTime), dayjs(item.endTime)]
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          fee: 300000,
          status: 'Active',
          dates: [dayjs().startOf('month'), dayjs().endOf('month')],
          subject: activeSubject?.id,
          grade: activeGrade?.id
        });
      }
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    let result;
    if (modalType === 'class') {
      try {
        const values = await form.validateFields();
        const classData = {
          ...values,
          startTime: values.dates[0].toISOString(),
          endTime: values.dates[1].toISOString()
        };
        delete classData.dates;

        result = editingItem 
          ? await ClassQuery.updateClass(editingItem.id, classData) 
          : await ClassQuery.addClass(classData, selectedTerm.id);
          
        if (result.success) fetchClasses(selectedTerm.id);
      } catch (error) { return; }
    } else {
      if (!itemName.trim()) return message.error("Name cannot be empty");
      
      if (modalType === 'year') {
        result = editingItem ? await ClassQuery.updateYear(editingItem.id, { name: itemName }) : await ClassQuery.addYear(itemName);
        if (result.success) fetchYears();
      } else if (modalType === 'term') {
        result = editingItem ? await ClassQuery.updateTerm(editingItem.id, { name: itemName }) : await ClassQuery.addTerm(itemName, selectedYear.id);
        if (result.success) fetchTerms(selectedYear.id);
      }
    }

    if (result?.success) {
      message.success("Saved successfully");
      setIsModalOpen(false);
    } else if (result) {
      message.error(result.message);
    }
  };

  const handleDelete = async (type, id) => {
    let result;
    if (type === 'year') {
      result = await ClassQuery.deleteYear(id);
      if (result.success) {
        setYears(years.filter(y => y.id !== id));
        if (selectedYear?.id === id) { setSelectedYear(null); setTerms([]); setClasses([]); }
      }
    } else if (type === 'term') {
      result = await ClassQuery.deleteTerm(id);
      if (result.success) {
        setTerms(terms.filter(t => t.id !== id));
        if (selectedTerm?.id === id) { setSelectedTerm(null); setClasses([]); }
      }
    } else if (type === 'class') {
      result = await ClassQuery.deleteClass(id);
      if (result.success) setClasses(classes.filter(c => c.id !== id));
    }
    
    if (result.success) message.success("Deleted successfully");
    else message.error(result.message);
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 20 }}>Class Management</Title>
      
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <ClassFilterBar 
          years={years} terms={terms} 
          selectedYear={selectedYear} selectedTerm={selectedTerm}
          handleSelectYear={handleSelectYear} handleSelectTerm={handleSelectTerm}
          openModal={openModal} handleDelete={handleDelete}
        />

        <ClassBoard 
          selectedTerm={selectedTerm}
          subjects={subjects} grades={grades}
          activeSubject={activeSubject} activeGrade={activeGrade}
          setActiveSubject={setActiveSubject} setActiveGrade={setActiveGrade}
          classes={classes}
          openModal={openModal} handleDelete={handleDelete}
        />
      </Space>

      <ClassActionModal 
        isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}
        modalType={modalType} editingItem={editingItem}
        itemName={itemName} setItemName={setItemName}
        form={form} handleSave={handleSave}
        grades={grades} subjects={subjects} teachers={teachers}
      />
    </div>
  );
}