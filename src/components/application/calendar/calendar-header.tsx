"use client";

import { useTemplateCopy } from "@/components/foundations/template-copy/template-copy";

import { RiAddFill, RiCalendarLine, RiMenuLine } from "@remixicon/react";
import type { CalendarDate } from "@internationalized/date";
import { Avatar } from "@/components/base/avatar/avatar";
import { Breadcrumb, BreadcrumbItem } from "@/components/base/breadcrumb/breadcrumb";
import { Button } from "@/components/base/buttons/button";
import { IconButton } from "@/components/base/buttons/icon-button";
import { CalendarInboxMenu } from "@/components/application/calendar/calendar-inbox-menu";
import { CalendarMonthSwitcher } from "@/components/application/calendar/calendar-month-switcher";
import { TemplateNotificationCenterMenu } from "@/components/application/notification-center/template-notification-center-menu";
import { cx } from "@/utils/cx";

/**
 * Figma source: Board UI → "calendar_view" → Frame 60 (node 3905:9200).
 *
 * Breadcrumb (Board team → Mertcan → Calendar) + a title/actions row: month
 * label, notification bell (unread badge, same recipe as `DashboardHeader`),
 * inbox, the month switcher (`CalendarMonthSwitcher` — enlarges in place
 * rather than opening node 3906:9797's own popover), and the primary
 * "New event" button.
 */

export function CalendarHeader({
  month,
  monthLabel,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  unreadCount = 5,
  onMenuClick,
  onNewEvent,
  showBreadcrumb = true,
  showNotification = true,
  monthSwitcherWidth,
  monthSwitcherClassName,
  controlClassName,
  headingLevel = 1,
}: {
  month: CalendarDate;
  monthLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: CalendarDate) => void;
  unreadCount?: number;
  onMenuClick?: () => void;
  onNewEvent?: () => void;
  /** Hide the workspace breadcrumb — used by the docs preview, which shows
   *  the calendar standalone without the surrounding app shell. */
  showBreadcrumb?: boolean;
  /** Hide the notification action in compact embedded previews. */
  showNotification?: boolean;
  /** Override the month selector width in compact embedded previews. */
  monthSwitcherWidth?: number;
  /** Override the month selector layout in compact embedded previews. */
  monthSwitcherClassName?: string;
  /** Normalize action heights in compact embedded previews. */
  controlClassName?: string;
  /**
   * Heading level for the month label. Defaults to `1`: on the calendar
   * template the month *is* the page title. Drop it to `2`+ wherever the
   * calendar is embedded as a preview inside a page that already has an
   * `<h1>` — two `<h1>`s in one document flattens the outline for screen
   * readers and for anything reading the page as a document.
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}) {
  const localize = useTemplateCopy();
  const MonthHeading = `h${headingLevel}` as const;
  return localize((
    <header className="flex w-full flex-col gap-1">
      {/* Breadcrumb */}
      {showBreadcrumb && (
        <Breadcrumb>
          <BreadcrumbItem href="/templates/dashboard">
            <Avatar size="xs" color="blue" initials="B" />
            Board team
          </BreadcrumbItem>
          <BreadcrumbItem href="/templates/dashboard">
            <Avatar size="xs" color="neutral" initials="M" />
            Mertcan
          </BreadcrumbItem>
          <BreadcrumbItem current icon={RiCalendarLine}>
            Calendar
          </BreadcrumbItem>
        </Breadcrumb>
      )}

      {/* Title + actions */}
      <div className="flex w-full flex-wrap items-end justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {onMenuClick && (
            <IconButton
              icon={RiMenuLine}
              size="medium"
              aria-label="Open navigation"
              onClick={onMenuClick}
              className="lg:hidden"
            />
          )}
          <MonthHeading className="px-1 text-title-2-medium whitespace-nowrap text-text-primary">
            {monthLabel}
          </MonthHeading>
        </div>

        <div className="flex w-full flex-nowrap items-start justify-end gap-2.5 sm:w-auto">
          {showNotification ? <TemplateNotificationCenterMenu unreadCount={unreadCount} /> : null}

          <CalendarInboxMenu triggerClassName={controlClassName} />

          <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:w-auto sm:flex-none sm:shrink-0">
            <CalendarMonthSwitcher
              month={month}
              monthLabel={monthLabel}
              onPrevMonth={onPrevMonth}
              onNextMonth={onNextMonth}
              onSelectDate={onSelectDate}
              width={monthSwitcherWidth}
              className={cx(monthSwitcherClassName, controlClassName)}
            />

            <Button
              variant="primary"
              size="medium"
              leadingIcon={RiAddFill}
              onClick={onNewEvent}
              className={controlClassName}
            >
              New event
            </Button>
          </div>
        </div>
      </div>
    </header>
  ));
}
