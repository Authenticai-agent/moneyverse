import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.upsert({
    where: { slug: 'money-fundamentals' },
    update: {},
    create: {
      title: 'Money Fundamentals',
      description: 'A starter course for learning how money works.',
      slug: 'money-fundamentals',
      status: 'published',
      sortOrder: 1,
    },
  });

  const module = await prisma.module.upsert({
    where: { courseId_slug: { courseId: course.id, slug: 'needs-and-wants' } },
    update: {},
    create: {
      courseId: course.id,
      title: 'Needs and Wants',
      description: 'Learn the difference between things you need and things you want.',
      slug: 'needs-and-wants',
      status: 'published',
      sortOrder: 1,
    },
  });

  const lessons = [
    {
      title: 'What Is Money?',
      slug: 'what-is-money',
      minAge: 6,
      maxAge: 8,
      content: {
        slides: [
          { type: 'intro', text: 'Money is a tool people use to trade for things they need or want.' },
          { type: 'scenario', text: 'You have a dollar. You can buy a snack or save it for later.' },
        ],
      },
    },
    {
      title: 'Needs vs Wants',
      slug: 'needs-vs-wants',
      minAge: 6,
      maxAge: 8,
      content: {
        slides: [
          { type: 'intro', text: 'A need is something you must have to be safe and healthy.' },
          { type: 'quiz', text: 'Is a winter coat a need or a want?', options: ['Need', 'Want'], answer: 'Need' },
        ],
      },
    },
    {
      title: 'Saving for a Goal',
      slug: 'saving-for-a-goal',
      minAge: 9,
      maxAge: 12,
      content: {
        slides: [
          { type: 'intro', text: 'Saving means setting money aside until you have enough for a goal.' },
          { type: 'scenario', text: 'You earn $5 each week. A game costs $20. How many weeks will you save?' },
        ],
      },
    },
  ];

  for (const data of lessons) {
    const existing = await prisma.lesson.findUnique({
      where: { slug: data.slug },
      include: { versions: true },
    });

    if (existing) {
      continue;
    }

    const lesson = await prisma.lesson.create({
      data: {
        moduleId: module.id,
        title: data.title,
        slug: data.slug,
        minAge: data.minAge,
        maxAge: data.maxAge,
        status: 'published',
      },
    });

    const version = await prisma.lessonVersion.create({
      data: {
        lessonId: lesson.id,
        version: 1,
        content: data.content,
        status: 'published',
        publishedAt: new Date(),
      },
    });

    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { publishedVersionId: version.id },
    });
  }

  console.log('Seeded curriculum');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
