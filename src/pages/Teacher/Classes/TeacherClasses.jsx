import React, { useEffect, useState } from 'react';
import { Space, Typography } from 'antd';
import dayjs from 'dayjs';
import * as ClassQuery from '../../../data/Center/classQuery';
import { getGrades, getSubjects } from '../../../data/Center/sectionQuery';
import { useAuth } from '../../../context/AuthContext';

import ClassFilterBar from '../../Admin/Classes/partials/ClassFilterBar';
import ClassBoard from '../../Admin/Classes/partials/ClassBoard';

const { Title } = Typography;

export default function TeacherClasses() {
  const { user } = useAuth();
  const [years, setYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [allGrades, setAllGrades] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  
  // Dùng để chỉ lưu những Môn mà giáo viên dạy
  const [displaySubjects, setDisplaySubjects] = useState([]);

  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeGrade, setActiveGrade] = useState(null);

  const filterMyClasses = (allClasses) => {
    if (!user) return [];
    return allClasses.filter(c => c.teacher === user.id || c.teacherId === user.id);
  };

  const updateDisplaySubjects = (teacherClasses, subjectsList) => {
    // Lấy ID những môn học mà giáo viên này có lớp
    const activeSubjectIds = new Set(teacherClasses.map(c => c.subject));
    setDisplaySubjects(subjectsList.filter(s => activeSubjectIds.has(s.id)));
  };

  useEffect(() => {
    const initializeData = async () => {
      const [fetchedYears, fetchedGrades, fetchedSubjects] = await Promise.all([
        ClassQuery.getAllYears(),
        getGrades(),
        getSubjects()
      ]);

      setYears(fetchedYears);
      setAllGrades(fetchedGrades);
      setAllSubjects(fetchedSubjects);

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
          const myClasses = filterMyClasses(fetchedClasses);
          
          setClasses(myClasses);
          updateDisplaySubjects(myClasses, fetchedSubjects);
        }
      }
    };

    initializeData();
  }, [user]);

  const handleSelectYear = async (yearId) => {
    const year = years.find(y => y.id === yearId);
    setSelectedYear(year);
    setSelectedTerm(null);
    setClasses([]);
    setDisplaySubjects([]);
    setActiveSubject(null);
    setActiveGrade(null);
    setTerms(await ClassQuery.getTermsByYear(year.id));
  };

  const handleSelectTerm = async (termId) => {
    const term = terms.find(t => t.id === termId);
    setSelectedTerm(term);
    setActiveSubject(null);
    setActiveGrade(null);
    const fetchedClasses = await ClassQuery.getClassesByTerm(term.id);
    const myClasses = filterMyClasses(fetchedClasses);
    
    setClasses(myClasses);
    updateDisplaySubjects(myClasses, allSubjects);
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 20 }}>Lớp học của tôi</Title>
      
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <ClassFilterBar 
          years={years} terms={terms} 
          selectedYear={selectedYear} selectedTerm={selectedTerm}
          handleSelectYear={handleSelectYear} handleSelectTerm={handleSelectTerm}
          isReadOnly={true} // Tắt tính năng Create/Edit/Delete
        />

        <ClassBoard 
          selectedTerm={selectedTerm}
          subjects={displaySubjects} // Chỉ truyền vào những môn mà giáo viên dạy
          grades={allGrades}         // ClassBoard sẽ tự động loại bỏ các khối trống
          activeSubject={activeSubject} activeGrade={activeGrade}
          setActiveSubject={setActiveSubject} setActiveGrade={setActiveGrade}
          classes={classes}
          isReadOnly={true} // Tắt tính năng Create/Edit/Delete
          role="Teacher"    // Điều hướng đường dẫn lúc click sang /teacher/...
        />
      </Space>
    </div>
  );
}