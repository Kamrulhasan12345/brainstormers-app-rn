import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Users,
  Target,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';

interface Student {
  id: string;
  roll: string;
  profile: {
    full_name: string | null;
  };
}

interface Course {
  id: string;
  name: string;
  code: string;
}

interface LectureBatch {
  id: string;
  title: string;
  course: {
    name: string;
  };
}

interface ExamBatch {
  id: string;
  exam: {
    name: string;
  };
}

interface RecipientSelectorProps {
  targetType: string;
  targetId: string;
  students: Student[];
  courses: Course[];
  lectureBatches: LectureBatch[];
  examBatches: ExamBatch[];
  onSelectTargetType: (type: string) => void;
  onSelectTarget: (id: string) => void;
  onClose: () => void;
}

export default function RecipientSelector({
  targetType,
  targetId,
  students,
  courses,
  lectureBatches,
  examBatches,
  onSelectTargetType,
  onSelectTarget,
  onClose,
}: RecipientSelectorProps) {
  const targetOptions = [
    { value: 'all_students', label: 'All Students', icon: Users },
    { value: 'specific_student', label: 'Specific Student', icon: Target },
    { value: 'course_students', label: 'Course Students', icon: BookOpen },
    { value: 'lecture_absentees', label: 'Lecture Absentees', icon: Clock },
    { value: 'exam_absentees', label: 'Exam Absentees', icon: AlertTriangle },
  ];

  const renderSubOptions = () => {
    switch (targetType) {
      case 'specific_student':
        return (
          <View style={styles.subOptions}>
            <Text style={styles.subOptionsTitle}>Select Student:</Text>
            {students.map((student) => (
              <TouchableOpacity
                key={student.id}
                style={[
                  styles.subOption,
                  targetId === student.id && styles.subOptionSelected,
                ]}
                onPress={() => {
                  onSelectTarget(student.id);
                  onClose();
                }}
              >
                <Text style={styles.subOptionText}>
                  {student.profile.full_name || 'Unknown'} ({student.roll})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'course_students':
        return (
          <View style={styles.subOptions}>
            <Text style={styles.subOptionsTitle}>Select Course:</Text>
            {courses.map((course) => (
              <TouchableOpacity
                key={course.id}
                style={[
                  styles.subOption,
                  targetId === course.id && styles.subOptionSelected,
                ]}
                onPress={() => {
                  onSelectTarget(course.id);
                  onClose();
                }}
              >
                <Text style={styles.subOptionText}>
                  {course.name} ({course.code})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'lecture_absentees':
        return (
          <View style={styles.subOptions}>
            <Text style={styles.subOptionsTitle}>Select Lecture:</Text>
            {lectureBatches.map((lecture) => (
              <TouchableOpacity
                key={lecture.id}
                style={[
                  styles.subOption,
                  targetId === lecture.id && styles.subOptionSelected,
                ]}
                onPress={() => {
                  onSelectTarget(lecture.id);
                  onClose();
                }}
              >
                <Text style={styles.subOptionText}>
                  {lecture.title} - {lecture.course.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'exam_absentees':
        return (
          <View style={styles.subOptions}>
            <Text style={styles.subOptionsTitle}>Select Exam:</Text>
            {examBatches.map((exam) => (
              <TouchableOpacity
                key={exam.id}
                style={[
                  styles.subOption,
                  targetId === exam.id && styles.subOptionSelected,
                ]}
                onPress={() => {
                  onSelectTarget(exam.id);
                  onClose();
                }}
              >
                <Text style={styles.subOptionText}>Exam Batch {exam.id}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Target Type Options */}
      {targetOptions.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.option,
            targetType === option.value && styles.optionSelected,
          ]}
          onPress={() => {
            onSelectTargetType(option.value);
            if (option.value === 'all_students') {
              onClose();
            }
          }}
        >
          <option.icon size={20} color="#64748B" />
          <Text style={styles.optionText}>{option.label}</Text>
          {targetType === option.value && (
            <CheckCircle size={20} color="#2563EB" />
          )}
        </TouchableOpacity>
      ))}

      {/* Sub Options */}
      {renderSubOptions()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  optionSelected: {
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
    fontFamily: 'Inter-Regular',
  },
  subOptions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
  },
  subOptionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
    fontFamily: 'Inter-Medium',
  },
  subOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  subOptionText: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'Inter-Regular',
  },
});
