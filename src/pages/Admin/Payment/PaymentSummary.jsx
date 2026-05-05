import React, { useState, useEffect } from 'react';
// Import your database/query functions here based on your data folder
// import { fetchAllStudents } from '../../../data/Users/userQuery';
// import { fetchStudentClasses } from '../../../data/Center/classQuery';

const PaymentSummary = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Define terms - in a real app, this might come from your database
  const terms = ['Spring 2026', 'Summer 2026', 'Fall 2026', 'Winter 2026'];
  
  // Calculate default term based on current time
  const getCurrentTerm = () => {
    const month = new Date().getMonth(); // 0-11
    if (month >= 0 && month <= 4) return 'Spring 2026';
    if (month >= 5 && month <= 7) return 'Summer 2026';
    if (month >= 8 && month <= 11) return 'Fall 2026';
    return terms[0];
  };

  const [selectedTerm, setSelectedTerm] = useState(getCurrentTerm());

  useEffect(() => {
    const loadSummaryData = async () => {
      setLoading(true);
      try {
        // 1. Fetch all student users
        // const studentData = await fetchAllStudents(); 
        
        // Mock data representation based on your requirements
        const mockStudents = [
          { id: 1, name: 'John Doe', grade: '10th Grade', classes: { 'Spring 2026': ['Math 101', 'Physics'], 'Fall 2026': ['Chemistry'] } },
          { id: 2, name: 'Jane Smith', grade: '11th Grade', classes: { 'Spring 2026': ['Biology', 'English'], 'Summer 2026': ['Art'] } },
        ];
        
        setStudents(mockStudents);
      } catch (error) {
        console.error("Failed to fetch students", error);
      } finally {
        setLoading(false);
      }
    };

    loadSummaryData();
  }, []);

  if (loading) return <div>Loading summary...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2>Student Class Summary</h2>
        
        {/* Term Selector */}
        <div>
          <label className="mr-2 font-semibold">Select Term:</label>
          <select 
            value={selectedTerm} 
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="border p-2 rounded"
          >
            {terms.map(term => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Student Name</th>
            <th className="border p-2 text-left">Grade</th>
            <th className="border p-2 text-left">Term</th>
            <th className="border p-2 text-left">Enrolled Classes</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            // Retrieve classes for the currently selected term
            const studentClasses = student.classes[selectedTerm] || [];
            
            return (
              <tr key={student.id}>
                <td className="border p-2">{student.name}</td>
                <td className="border p-2">{student.grade}</td>
                <td className="border p-2">{selectedTerm}</td>
                <td className="border p-2">
                  {studentClasses.length > 0 ? (
                    <ul className="list-disc ml-4">
                      {studentClasses.map((cls, index) => (
                        <li key={index}>{cls}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500 italic">No classes this term</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentSummary;