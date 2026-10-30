import { expect, test } from '@playwright/test';
import {
  backlogItems,
  sprintWorkHours,
  totalWorkHours,
  workHours,
  type BacklogItem,
} from '../src/data/backlogItems.ts';
import { LIMITS } from '../src/data/limits.ts';
import {
  completedHours,
  planRemaining,
  simulatedRemaining,
  sprintNumbers,
  sprintStart,
  WORKING_DAYS,
  workingDays,
} from '../src/data/metrics.ts';
import {
  EMPTY_SLOT_LABEL,
  evidenceFileName,
  evidenceSlots,
} from '../src/data/sprintEvidence.ts';
import {
  customerNotes,
  CUSTOMER_REVIEW_LABEL,
  developers,
  hoursFor,
  memberShort,
  partLabel,
  productOwner,
  retroNotes,
  reviewNotes,
  roleSprints,
  scrumMaster,
  SIMULATION_LABEL,
  sprintPackageHours,
  workRows,
} from '../src/data/team.ts';
import { boundaryText, presentSections } from './support/b8-support.ts';

function hoursText(item: BacklogItem): string {
  const total = `${workHours(item)} ч`;
  const parts = sprintNumbers.flatMap((sprint) => {
    const hours = item.hoursBySprint[sprint];
    return hours === undefined ? [] : [`${hours} ч в спринте ${sprint}`];
  });
  if (parts.length < 2) return total;
  return `${total}, из них ${parts.join(', ')}`;
}

test.use({ viewport: { width: 1280, height: 800 } });

test.beforeEach(async ({ page }) => {
  await page.goto('/defense');
});

test('defense page is one linked column reached from the nav', async ({
  page,
}) => {
  await page.goto('/login');
  await page
    .getByRole('navigation', { name: 'Разделы' })
    .getByRole('link', { name: 'Защита проекта' })
    .click();
  await expect(page).toHaveURL(/\/defense$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Защита проекта' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

  const box = await page.getByRole('main').boundingBox();
  if (!box) throw new Error('main column is missing');
  expect(Math.round(box.width)).toBe(720);

  const contents = page.getByRole('navigation', { name: 'Содержание' });
  for (const [href, title] of presentSections) {
    const link = contents.getByRole('link', { name: title });
    await expect(link).toHaveAttribute('href', href);
    await link.click();
    await expect(page.locator(href)).toBeInViewport();
    await expect(
      page.locator(href).getByRole('heading', { level: 2, name: title }),
    ).toBeVisible();
  }

  const hrefs = await page
    .locator('a')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
  expect(hrefs).not.toContain('#');
});

test('defense goal names the team, the dates and the four limits', async ({
  page,
}) => {
  const goal = page.locator('#goal');
  await expect(goal).toContainText('статическ');
  await expect(goal).toContainText('предпросмотр');
  await expect(goal).toContainText('публикац');
  await expect(goal).toContainText('предыдущ');
  await expect(goal).toContainText(productOwner.name);
  await expect(goal).toContainText(productOwner.role);
  await expect(goal).toContainText(scrumMaster.name);
  await expect(goal).toContainText(scrumMaster.role);
  for (const person of developers) {
    await expect(goal).toContainText(person.name);
  }
  await expect(goal).toContainText('28.10.2026');
  await expect(goal).toContainText('17.11.2026');
  await expect(goal).toContainText('Zhansaya Shinbergenova');
  await expect(goal.getByRole('definition')).toHaveText([
    String(LIMITS.sites),
    String(LIMITS.archiveMb),
    String(LIMITS.unpackedMb),
    String(LIMITS.storageMb),
  ]);
});

test('defense user path lists five linked steps', async ({ page }) => {
  const path = page.locator('#path');
  const labels = [
    /подготовить файлы/i,
    /загрузить и проверить/i,
    /предпросмотр/i,
    /опубликовать/i,
    /вернуть версию/i,
  ];
  const links = path.getByRole('list').getByRole('link');
  await expect(links).toHaveCount(labels.length);
  for (let index = 0; index < labels.length; index += 1) {
    const link = links.nth(index);
    await expect(link).toHaveText(labels[index] ?? /.^/);
    const href = await link.getAttribute('href');
    expect(href === '/login' || href?.startsWith('/manage/')).toBe(true);
  }
});

test('defense status lists every backlog item with hours, sprint and a link', async ({
  page,
}) => {
  const status = page.locator('#status');
  for (const item of backlogItems) {
    const block = status.locator('li').filter({ hasText: `${item.id}.` });
    await expect(block).toContainText(item.title);
    await expect(block).toContainText(item.status);
    await expect(block).toContainText(`План: ${hoursText(item)}`);
    await expect(block).toContainText(`Спринт ${item.sprint}`);
    const href = await block.getByRole('link').getAttribute('href');
    expect(
      href === '/login' ||
        href === '/defense' ||
        href?.startsWith('/manage/') ||
        href?.startsWith('/site/'),
    ).toBe(true);
  }
});

test('defense plan table uses backlog hours and labels simulation', async ({
  page,
}) => {
  const plan = page.locator('#plan');
  await expect(plan).toContainText('«план»');
  await expect(plan).toContainText('«симуляция»');
  const table = plan.getByRole('table', { name: 'План, рабочие часы' });
  for (const item of backlogItems) {
    const row = table
      .getByRole('row')
      .filter({ hasText: `${item.id}. ${item.title}` });
    await expect(row).toContainText(`Всего ${workHours(item)} ч`);
    for (const [sprint, hours] of Object.entries(item.hoursBySprint)) {
      await expect(row).toContainText(`Спринт ${sprint}: ${hours} ч`);
    }
  }
  const bySprint = sprintNumbers
    .map((sprint) => `${sprintWorkHours(sprint)} ч`)
    .join(', ');
  await expect(plan).toContainText(`По спринтам: ${bySprint}.`);
  await expect(plan).toContainText(`Вместе ${totalWorkHours()} ч.`);
});

test('defense burndown shows plan and simulation for each sprint', async ({
  page,
}) => {
  const burndown = page.locator('#burndown');
  await expect(burndown.locator('svg')).toHaveCount(sprintNumbers.length);
  await expect(burndown).toContainText(`от ${sprintWorkHours(1)} к 0`);
  await expect(burndown).toContainText(`${WORKING_DAYS} рабочих дней`);
  await expect(
    burndown.getByText('план', { exact: true }).first(),
  ).toBeVisible();
  await expect(
    burndown.getByText('симуляция', { exact: true }).first(),
  ).toBeVisible();
  await expect(burndown).toContainText('26 story points');
  await expect(burndown).toContainText('рабочих часах');

  for (const sprint of sprintNumbers) {
    const dates = workingDays(sprintStart[sprint]);
    const end = dates[dates.length - 1] ?? '';
    await expect(
      burndown.getByRole('heading', {
        name: `Спринт ${sprint}, ${dates[0]}–${end}`,
      }),
    ).toBeVisible();
    await expect(
      burndown.getByRole('img', {
        name: `Спринт ${sprint}: линия плана и линия симуляции`,
      }),
    ).toBeVisible();

    const planned = planRemaining(sprintWorkHours(sprint));
    const simulated = simulatedRemaining[sprint];
    const rows = burndown
      .getByRole('table', { name: `Спринт ${sprint}, оставшиеся часы` })
      .locator('tbody tr');
    await expect(rows).toHaveCount(planned.length);
    for (let index = 0; index < planned.length; index += 1) {
      const cells = rows.nth(index).locator('td');
      await expect(cells.nth(1)).toHaveText(String(planned[index]));
      await expect(cells.nth(2)).toHaveText(String(simulated[index]));
    }
  }

  const velocity = burndown.getByRole('table', {
    name: 'Скорость, закрытые рабочие часы',
  });
  for (const sprint of sprintNumbers) {
    const row = velocity.getByRole('row', {
      name: new RegExp(`^${sprint}\\s`),
    });
    const cells = row.getByRole('cell');
    await expect(cells.nth(0)).toHaveText(String(sprintWorkHours(sprint)));
    await expect(cells.nth(1)).toHaveText(
      String(completedHours(simulatedRemaining[sprint])),
    );
  }
});

test('defense feedback, retrospective and roles come from the team record', async ({
  page,
}) => {
  const feedback = page.locator('#feedback');
  expect(customerNotes.length).toBeGreaterThanOrEqual(1);
  expect(customerNotes.length).toBeLessThanOrEqual(2);
  await expect(feedback.getByRole('figure')).toHaveCount(customerNotes.length);
  await expect(feedback.locator('img')).toHaveCount(0);
  await expect(feedback).not.toContainText('★');
  await expect(feedback).not.toContainText(/звезд/i);
  for (const note of customerNotes) {
    const figure = feedback.getByRole('figure').filter({ hasText: note.role });
    await expect(figure).toContainText(CUSTOMER_REVIEW_LABEL);
    await expect(figure).toContainText(note.text);
  }

  const retro = page.locator('#retro');
  await expect(retro).toContainText(SIMULATION_LABEL);
  for (const note of retroNotes) {
    await expect(
      retro.getByRole('heading', { name: note.heading }),
    ).toBeVisible();
    await expect(retro).toContainText(note.text);
  }

  const roles = page.locator('#roles');
  await expect(roles).toContainText(
    `${productOwner.role}: ${productOwner.name}`,
  );
  await expect(roles).toContainText(`${scrumMaster.role}: ${scrumMaster.name}`);
  for (const person of developers) {
    await expect(roles).toContainText(person.name);
  }
  const hours = roles.getByRole('table', { name: 'План, часы по людям' });
  for (const member of memberShort) {
    const row = hours.getByRole('row', { name: member });
    const cells = row.getByRole('cell');
    for (let index = 0; index < roleSprints.length; index += 1) {
      const sprint = roleSprints[index];
      if (!sprint) continue;
      await expect(cells.nth(index)).toHaveText(
        String(hoursFor(member, sprint)),
      );
    }
  }
  const total = hours.getByRole('row', { name: 'Всего' });
  for (let index = 0; index < roleSprints.length; index += 1) {
    const sprint = roleSprints[index];
    if (!sprint) continue;
    await expect(total.getByRole('cell').nth(index)).toHaveText(
      String(sprintPackageHours(sprint)),
    );
  }
  for (const row of workRows) {
    await expect(roles).toContainText(
      `${row.item}. ${row.work}. ${row.activity}. ${row.member}, ${row.hours} ч, ${partLabel(row.part)}.`,
    );
  }
  for (const note of reviewNotes) {
    await expect(roles).toContainText(note);
  }
});

test('defense evidence log has an empty slot for every sprint check', async ({
  page,
}) => {
  const log = page.locator('#evidence-log');
  for (const sprint of sprintNumbers) {
    await expect(
      log.getByRole('heading', { level: 3, name: `Спринт ${sprint}` }),
    ).toBeVisible();
  }
  for (const slot of evidenceSlots) {
    const item = log.locator('li').filter({ hasText: evidenceFileName(slot) });
    await expect(item).toContainText(slot.title);
    await expect(item).toContainText(EMPTY_SLOT_LABEL);
    await expect(item).not.toContainText('пройдено');
  }
  await expect(log.getByText(EMPTY_SLOT_LABEL)).toHaveCount(
    evidenceSlots.length,
  );
});

test('defense boundaries stay on the page', async ({ page }) => {
  await expect(page.locator('#boundaries')).toContainText(boundaryText);
});
