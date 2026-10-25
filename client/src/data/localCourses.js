// Small, original starter catalog so the learning flow remains usable while
// the Express/PostgreSQL API is unavailable or has not been seeded yet.
import coursePack from "./course-pack/courses.json";
import courseQuestions from "./course-pack/questions.json";

const COURSE_KEY = "careercraft-local-course-enrollments";
const LESSON_KEY = "careercraft-local-completed-lessons";
const QUIZ_KEY = "careercraft-local-course-quiz-scores";

const COURSE_BANNERS = {
  "IT & Software": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&auto=format&fit=crop&q=85",
  "Data & Analytics": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=85",
  "Cloud & Cybersecurity": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=85",
  "Marketing & Content": "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=1200&auto=format&fit=crop&q=85",
  "Business & Management": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&auto=format&fit=crop&q=85",
  "Business & Finance": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=85",
  "Healthcare & Life Sciences": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=85",
};

const handmadeCourses = [
  {
    id: "local-python-fundamentals",
    title: "Python Programming Fundamentals",
    slug: "python-programming-fundamentals",
    shortDescription: "Learn Python syntax, control flow, functions, and practical problem solving.",
    description: "Build a strong Python foundation through short lessons and hands-on exercises. You will write small programs, break problems into functions, and finish with a command-line project.",
    category: "Programming Languages",
    level: "beginner",
    instructorName: "CareerCraft Learning Team",
    durationMinutes: 105,
    thumbnailUrl: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=80",
    sections: [
      { id: "py-section-1", title: "Python Basics", description: "Values, expressions, and decisions.", sectionOrder: 1, lessons: [
        { id: "py-lesson-1", title: "Variables and Data Types", slug: "variables-and-data-types", lessonOrder: 1, lessonType: "article", durationMinutes: 15, isPreview: true, content: `# Variables and Data Types\n\nPython variables give names to values. You can assign a value with = and use it later in an expression.\n\n## Common types\n- Integers represent whole numbers, such as 21.\n- Floats represent decimal numbers, such as 3.14.\n- Strings store text, such as "CareerCraft".\n- Booleans represent True or False.\n\n\`\`\`python\nname = "Asha"\nyear = 3\nprint(f"{name} is in year {year}")\n\`\`\`\n\nTry changing the values and printing a short introduction. Further reading: [Python Tutorial](https://docs.python.org/3/tutorial/) · [Programiz Python](https://www.programiz.com/python-programming)` },
        { id: "py-lesson-2", title: "Conditions and Loops", slug: "conditions-and-loops", lessonOrder: 2, lessonType: "article", durationMinutes: 20, isPreview: false, content: `# Conditions and Loops\n\nUse if, elif, and else to select a path based on a condition. A for loop repeats work for each item in a sequence.\n\n\`\`\`python\nscores = [72, 91, 84]\nfor score in scores:\n    if score >= 85:\n        print("Ready for the next challenge")\n    else:\n        print("Keep practicing")\n\`\`\`\n\n## Practice\n- Print the numbers from 1 to 10.\n- Count how many scores are at least 80.\n- Use a while loop to repeat until a valid menu option is entered.\n\nFurther reading: [Python Tutorial](https://docs.python.org/3/tutorial/)` },
        { id: "py-lesson-3", title: "Functions and Mini Project", slug: "functions-mini-project", lessonOrder: 3, lessonType: "project", durationMinutes: 30, isPreview: false, content: `# Functions and Mini Project\n\nFunctions package a useful operation under a name. Parameters provide input and return sends a result back to the caller.\n\n\`\`\`python\ndef average(scores):\n    if not scores:\n        return 0\n    return sum(scores) / len(scores)\n\nprint(average([80, 90, 100]))\n\`\`\`\n\n## Build a study tracker\nCreate a command-line program that stores a list of study topics, marks one complete, and reports the completion percentage. Split input, updates, and reporting into separate functions. Add a test for an empty topic list.\n\nFurther reading: [Python Tutorial](https://docs.python.org/3/tutorial/)` },
      ] },
    ],
  },
  {
    id: "local-java-fundamentals",
    title: "Java Programming Fundamentals",
    slug: "java-programming-fundamentals",
    shortDescription: "Practice Java syntax, methods, arrays, and object-oriented building blocks.",
    description: "Start writing Java programs with a guided introduction to types, control flow, methods, and classes. Apply each concept in a small student gradebook project.",
    category: "Programming Languages",
    level: "beginner",
    instructorName: "CareerCraft Learning Team",
    durationMinutes: 110,
    thumbnailUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=80",
    sections: [
      { id: "java-section-1", title: "Java Foundations", description: "Types, decisions, and reusable methods.", sectionOrder: 1, lessons: [
        { id: "java-lesson-1", title: "Your First Java Program", slug: "first-java-program", lessonOrder: 1, lessonType: "article", durationMinutes: 15, isPreview: true, content: `# Your First Java Program\n\nA Java application starts in a class. The main method is the entry point used to run a simple program.\n\n\`\`\`java\npublic class Main {\n    public static void main(String[] args) {\n        String goal = "Build useful software";\n        int lessons = 3;\n        System.out.println(goal + " in " + lessons + " lessons");\n    }\n}\n\`\`\`\n\nJava variables have declared types. Use String for text, int for whole numbers, double for decimal numbers, and boolean for true/false values. Further reading: [Dev.java Learn](https://dev.java/learn/) · [Java Language Basics](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/)` },
        { id: "java-lesson-2", title: "Conditions, Loops, and Methods", slug: "conditions-loops-methods", lessonOrder: 2, lessonType: "article", durationMinutes: 25, isPreview: false, content: `# Conditions, Loops, and Methods\n\nUse if and else to branch. A for loop repeats a block a known number of times. Methods give a name to reusable work.\n\n\`\`\`java\nstatic int countPassing(int[] scores) {\n    int count = 0;\n    for (int score : scores) {\n        if (score >= 50) count++;\n    }\n    return count;\n}\n\`\`\`\n\n## Practice\n- Write a method that returns the largest number in an integer array.\n- Add a method that converts a numeric score into a letter grade.\n- Try an empty array and a single-element array.\n\nFurther reading: [Dev.java Learn](https://dev.java/learn/)` },
        { id: "java-lesson-3", title: "Classes and Gradebook Project", slug: "classes-gradebook-project", lessonOrder: 3, lessonType: "project", durationMinutes: 35, isPreview: false, content: `# Classes and Gradebook Project\n\nA class describes data and behavior. An object is an instance of a class. Keep fields private and expose clear methods to protect the object's state.\n\n\`\`\`java\nclass Student {\n    private final String name;\n    private final int score;\n\n    Student(String name, int score) {\n        this.name = name;\n        this.score = score;\n    }\n\n    String getName() { return name; }\n    int getScore() { return score; }\n}\n\`\`\`\n\n## Build a gradebook\nCreate a list of students, validate scores from 0 to 100, calculate the average, and print a summary. Add tests for boundary scores and an empty class.\n\nFurther reading: [Dev.java Learn](https://dev.java/learn/)` },
      ] },
    ],
  },
];

const packCourses = coursePack.map((course) => ({
  id: course.id,
  title: course.title,
  slug: course.id,
  thumbnailUrl: COURSE_BANNERS[course.domain] || COURSE_BANNERS["IT & Software"],
  shortDescription: course.description,
  description: course.description,
  category: course.domain === "Business & Management" || course.domain === "Business & Finance"
    ? "Business, Management & Finance"
    : course.domain,
  level: course.level.toLowerCase(),
  instructorName: "CareerCraft Learning Team",
  durationMinutes: course.modules.flatMap((module) => module.lessons).length * 10,
  sections: course.modules.map((module, sectionIndex) => ({
    id: module.id,
    title: module.title.replace(/^Module\s+\d+:\s*/i, ""),
    description: "Concept notes, examples, and guided practice.",
    sectionOrder: sectionIndex + 1,
    lessons: module.lessons.map((lesson, lessonIndex) => ({
      id: lesson.id,
      title: lesson.title,
      slug: lesson.id,
      lessonOrder: lessonIndex + 1,
      lessonType: "article",
      durationMinutes: 10,
      isPreview: sectionIndex === 0 && lessonIndex === 0,
      content: lesson.content,
    })),
  })),
}));

const courses = [...handmadeCourses, ...packCourses];

function readList(key) {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch { return []; }
}

function writeList(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { /* Local fallback still works for the current page session. */ }
}

function allLessons(course) {
  return course.sections.flatMap((section) => section.lessons.map((lesson) => ({ ...lesson, section })));
}

function hydrateCourse(course) {
  const enrolledIds = readList(COURSE_KEY);
  const completedIds = readList(LESSON_KEY);
  const isEnrolled = enrolledIds.includes(course.id);
  const sections = course.sections.map((section) => ({
    ...section,
    lessons: section.lessons.map((lesson) => ({ ...lesson, completed: completedIds.includes(lesson.id) })),
  }));
  const lessons = sections.flatMap((section) => section.lessons);
  const completedCount = lessons.filter((lesson) => lesson.completed).length;
  const progressPercent = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;
  return {
    ...course,
    sections,
    lessonCount: lessons.length,
    isEnrolled,
    enrollmentStatus: progressPercent === 100 && isEnrolled ? "completed" : isEnrolled ? "enrolled" : null,
    status: progressPercent === 100 && isEnrolled ? "completed" : "in_progress",
    progressPercent,
  };
}

export function getLocalCourses() {
  return courses.map((course) => ({ ...hydrateCourse(course), isLocalCatalog: true }));
}

export function getLocalCourse(slug) {
  const course = courses.find((item) => item.slug === slug || item.id === slug);
  return course ? { ...hydrateCourse(course), isLocalCatalog: true } : null;
}

export function enrollLocalCourse(courseId) {
  const enrolled = readList(COURSE_KEY);
  if (!enrolled.includes(courseId)) writeList(COURSE_KEY, [...enrolled, courseId]);
  return { success: true, message: "Enrolled in the local course." };
}

export function getLocalEnrollments() {
  return getLocalCourses().filter((course) => course.isEnrolled).map((course) => ({ ...course, enrollmentStatus: course.enrollmentStatus }));
}

export function getLocalLesson(slug, lessonSlug) {
  const course = getLocalCourse(slug);
  if (!course) return null;
  const lessons = course.sections.flatMap((section) => section.lessons.map((lesson) => ({ ...lesson, section })));
  const index = lessons.findIndex((lesson) => lesson.slug === lessonSlug);
  if (index < 0) return null;
  const item = lessons[index];
  if (!item.isPreview && !course.isEnrolled) return null;
  return {
    success: true,
    lesson: item,
    section: item.section,
    course: { id: course.id, title: course.title, slug: course.slug },
    isEnrolled: course.isEnrolled,
    navigation: {
      previousLesson: index > 0 ? lessons[index - 1] : null,
      nextLesson: index < lessons.length - 1 ? lessons[index + 1] : null,
    },
  };
}

export function completeLocalLesson(lessonId) {
  const completed = readList(LESSON_KEY);
  if (!completed.includes(lessonId)) writeList(LESSON_KEY, [...completed, lessonId]);
  const course = courses.find((item) => allLessons(item).some((lesson) => lesson.id === lessonId));
  const courseNow = course ? hydrateCourse(course) : null;
  return {
    success: true,
    wasAlreadyCompleted: completed.includes(lessonId),
    awardedXp: completed.includes(lessonId) ? 0 : 2,
    courseNewlyCompleted: courseNow?.progressPercent === 100,
  };
}

export function getLocalCourseQuestions(slug) {
  const course = courses.find((item) => item.slug === slug || item.id === slug);
  if (!course) return [];
  return courseQuestions
    .filter((question) => question.courseId === course.id)
    .map((question) => ({ ...question }));
}

export function saveLocalQuizScore(courseId, score, total) {
  const scores = readList(QUIZ_KEY).filter((entry) => entry.courseId !== courseId);
  scores.push({ courseId, score, total, completedAt: new Date().toISOString() });
  writeList(QUIZ_KEY, scores);
  return { success: true, score, total };
}
