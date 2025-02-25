import { useState, useEffect } from "react";
import styles from "./praise_team.module.css";
import { format, startOfMonth, endOfMonth, eachWeekOfInterval } from "date-fns";
import AddMemberForm from "../FloatingEditForms/AddMemberForm";
import FloatingEdit from "../FloatingEditForms/FloatingEdit";
import { PraiseTeamService } from "../../../Backend/FirebaseServices";
import { CalendarService } from "../../services/CalendarService";
import type { CalendarEventDetails } from "../../services/CalendarService";

interface MonthCardProps {
	month: string;
	schedules: { [key: string]: any };
	onCardClick: (month: string) => void;
}

function capName(name: string): string {
	return name
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

const MonthCard = ({ month, schedules, onCardClick }: MonthCardProps) => {
	const schedule = schedules[month] || { members: [] };

	return (
		<div className={styles.card} onClick={() => onCardClick(month)}>
			<div className={styles.cardDate}>{month}</div>
			<div className={styles.memberList}>
				{schedule.members.map(
					(member: { role: string; name: string }, index: number) => {
						if (member.name) {
							// Check if the role is "Vocalist" and find any "Vocalist 2"
							if (member.role === "Vocalist") {
								const vocalist2 = schedule.members.find(
									(m: { role: string; name: any }) =>
										m.role === "Vocalist 2" && m.name
								);
								return (
									<div
										key={index}
										className={styles.memberItem}
									>
										<span className={styles.role}>
											{member.role}:
										</span>
										<span>{capName(member.name)}</span>
										{vocalist2 && (
											<span>
												{" "}
												& {capName(vocalist2.name)}
											</span>
										)}
									</div>
								);
							}
							// Skip rendering "Vocalist 2" if "Vocalist" is already rendered
							if (member.role === "Vocalist 2") {
								return null;
							}
							return (
								<div key={index} className={styles.memberItem}>
									<span className={styles.role}>
										{member.role}:
									</span>
									<span>{capName(member.name)}</span>
								</div>
							);
						}
						return null;
					}
				)}
			</div>
		</div>
	);
};
//This will get the sundays of the month
function getSundaysOfMonth(
	month: string,
	year: number = new Date().getFullYear()
) {
	const date = new Date(`${month} 1, ${year}`);
	const monthStart = startOfMonth(date);
	const monthEnd = endOfMonth(date);

	// Get all weeks in the month and filter for current month only
	const sundays = eachWeekOfInterval(
		{ start: monthStart, end: monthEnd },
		{ weekStartsOn: 0 }
	)
		.filter((sunday) => {
			// Only include Sundays that fall within the current month
			return format(sunday, "M") === format(monthStart, "M");
		})
		.map((week) => format(week, "MMMM d"));

	return sundays;
}

const MONTH_RANGES = [
	["January", "February", "March"],
	["April", "May", "June"],
	["July", "August", "September"],
	["October", "November", "December"],
];

export default function PraiseTeam() {
	const [church, setChurch] = useState("162nd");
	const [department, setDepartment] = useState("praise_team");

	const [selectedRange, setSelectedRange] = useState(getCurrentQuarter());
	// const [showNav, setShowNav] = useState(false);
	const [showAddMemberForm, setShowAddMemberForm] = useState(false);
	const [unlocked, setUnlocked] = useState<boolean>(() => {
		// Retrieve the value from sessionStorage or default to false
		const saved = sessionStorage.getItem("unlocked");
		return saved === "true"; // Convert string to boolean
	});
	const [showUnlockForm, setShowUnlockForm] = useState(false);
	const [showEditCard, setShowEditCard] = useState(false);
	const [editCardId, setEditCardId] = useState("");
	const currentRange = MONTH_RANGES[selectedRange]; //index 0 - 3

	const [members, setMembers] = useState<String[]>([]);

	useEffect(() => {
		// Update sessionStorage whenever the unlocked state changes
		sessionStorage.setItem("unlocked", JSON.stringify(unlocked));
	}, [unlocked]);

	useEffect(() => {
		const fetchMembers = async () => {
			try {
				const allMembers = await PraiseTeamService.getAllMembers(
					church
				);

				const memberNames = allMembers.map((member) => member.name);
				setMembers(memberNames);
			} catch (error) {
				console.error("Error fetching members:", error);
			}
		};

		fetchMembers();
	}, [church, department]); //Tracking the state of the church and department variables, if they change, we will refetch.

	function getCurrentQuarter(): number {
		const currentMonth = new Date().getMonth(); // 0-11
		return Math.floor(currentMonth / 3);
	}

	const UnlockForm = () => {
		const [password, setPassword] = useState("");

		const handleUnlock = () => {
			if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
				setUnlocked(true);
				sessionStorage.setItem("unlocked", "true");
				setShowUnlockForm(false);
			} else {
				alert("Incorrect password");
			}
		};

		return (
			<div
				className={styles.overlay}
				onClick={() => setShowUnlockForm(false)}
			>
				<div
					className={styles.unlockForm}
					onClick={(e) => e.stopPropagation()}
				>
					<h1>Unlock Editing Mode</h1>
					<input
						type='password'
						placeholder='Enter password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						onKeyPress={(e) => e.key === "Enter" && handleUnlock()}
						autoFocus
					/>
					<div className={styles.buttonContainer}>
						<button
							className={styles.cancelButton}
							onClick={() => setShowUnlockForm(false)}
						>
							Cancel
						</button>
						<button
							className={styles.unlockButton}
							onClick={handleUnlock}
						>
							Unlock
						</button>
					</div>
				</div>
			</div>
		);
	};

	const [schedules, setSchedules] = useState<{ [key: string]: any }>({});
	const [, setLoading] = useState(true);
	const fetchSchedules = async () => {
		try {
			if (unlocked) setUnlocked(true);
			const data = await PraiseTeamService.getSchedules(
				church,
				department
			);
			const schedulesMap = data.reduce(
				(acc, schedule) => ({
					...acc,
					[schedule.id]: schedule,
				}),
				{}
			);
			setSchedules(schedulesMap);
		} catch (error) {
			console.error("Error fetching schedules:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSchedules();
	}, [church, department]);

	const [selectedMember, setSelectedMember] = useState("");

	const handleCalendarAdd = async () => {
		if (!selectedMember) {
			alert("Please select a member first");
			return;
		}

		try {
			// Initialize the calendar service
			await CalendarService.initClient();

			// Filter schedules for selected member's events
			const memberEvents = Object.entries(schedules).filter(
				([_, schedule]) => {
					const hasMember = schedule.members.some(
						(m: any) =>
							m.name.toString().toLowerCase() ===
							selectedMember.toLowerCase()
					);
					console.log(
						"Checking schedule:",
						schedule.date,
						"Has member:",
						hasMember
					);
					return hasMember;
				}
			);

			if (memberEvents.length === 0) {
				console.log("No events found for member:", selectedMember);
				alert("No scheduled events found for the selected member.");
				return;
			}

			// Add each event to calendar
			for (const [scheduleId, schedule] of memberEvents) {
				console.log(
					"Processing schedule:",
					scheduleId,
					"Details:",
					schedule
				);

				// Parse the date from the schedule
				const dateMatch = schedule.date?.match(/\((.*?)\)/);
				if (!dateMatch) {
					console.log("No date match found for schedule:", schedule);
					continue;
				}

				const dateStr = dateMatch[1]; // e.g., "January 5"
				const eventDate = new Date(
					`${dateStr}, ${new Date().getFullYear()}`
				);

				console.log("Creating event for date:", eventDate);

				const memberRole = schedule.members.find(
					(m: any) =>
						m.name.toString().toLowerCase() ===
						selectedMember.toLowerCase()
				)?.role;

				console.log("Member role:", memberRole, "for date:", dateStr);

				if (memberRole) {
					// Set the time to 10 AM for the start
					const startTime = new Date(eventDate);
					startTime.setHours(10, 0, 0);

					// Set the time to 12 PM for the end
					const endTime = new Date(eventDate);
					endTime.setHours(12, 0, 0);

					const eventDetails: CalendarEventDetails = {
						summary: `Church Service - ${memberRole}`,
						description: `Serving as ${memberRole} at church`,
						start: startTime,
						end: endTime,
						reminders: {
							useDefault: false,
							overrides: [
								{
									method: "email" as const,
									minutes: 7 * 24 * 60,
								}, // 7 days before
								{
									method: "popup" as const,
									minutes: 7 * 24 * 60,
								}, // 7 days before
								{
									method: "email" as const,
									minutes: 2 * 24 * 60,
								}, // 2 days before
								{
									method: "popup" as const,
									minutes: 2 * 24 * 60,
								}, // 2 days before
							],
						},
					};

					await CalendarService.addEventToCalendar(eventDetails);
				} else {
					console.log("No role found for member on date:", dateStr);
				}
			}

			alert("Events have been added to your calendar!");
		} catch (error) {
			console.error("Error adding events to calendar:", error);
			alert("Failed to add events to calendar. Please try again.");
		}
	};

	return (
		<>
			<div className={styles.container}>
				<div className={styles.header}>
					<div className={styles.filterContainer}>
						<select
							className={styles.filterSelect}
							onChange={(e) => {
								setChurch(String(e.target.value));
							}}
						>
							<option value='162nd'> 162nd Chinese</option>
							<option value='162nd En'> 162nd English</option>
							<option value='137th'>137th Church</option>
						</select>

						<select
							className={styles.filterSelect}
							onChange={(e) => {
								setDepartment(String(e.target.value));
							}}
						>
							<option value='praise_team'>Praise Team </option>
							<option value='audio_video'> Audio/Video </option>
							<option value='general'> General </option>
						</select>
						<select
							className={styles.monthSelector}
							value={selectedRange}
							onChange={(e) =>
								setSelectedRange(Number(e.target.value))
							}
						>
							{MONTH_RANGES.map((range, index) => (
								<option key={index} value={index}>
									{range[0]} → {range[2]}
								</option>
							))}
						</select>
					</div>

					<div className={styles.buttonContainer}>
						<button
							className={styles.unlockButton}
							onClick={() => {
								if (unlocked) {
									setUnlocked(false);
								} else {
									setShowUnlockForm(true);
								}
							}}
						>
							{unlocked ? "🔒 Lock" : "🔓 Unlock"}
						</button>
						<button
							className={styles.addButton}
							onClick={() =>
								setShowAddMemberForm(!showAddMemberForm)
							}
							disabled={!unlocked}
						>
							➕ Add Member
						</button>
					</div>
				</div>

				<div className={styles.mainContent}>
					{currentRange.map((month) => (
						<div key={month} className={styles.monthSection}>
							<h2>{month}</h2>
							<div className={styles.cardGrid}>
								{getSundaysOfMonth(month).map(
									(sunday, index) => (
										<MonthCard
											key={sunday}
											month={`${
												index + 1
											}${getOrdinalSuffix(
												index + 1
											)} Sunday (${sunday})`}
											schedules={schedules}
											onCardClick={(month) => {
												setEditCardId(month);
												setShowEditCard(
													true && unlocked
												);
											}}
										/>
									)
								)}
							</div>
						</div>
					))}
				</div>

				<div className={styles.footer}>
					<select
						className={styles.userSelect}
						value={selectedMember}
						onChange={(e) => setSelectedMember(e.target.value)}
					>
						<option value=''>Select member</option>
						{members.map((member) => (
							<option
								key={member.toString()}
								value={member.toString()}
							>
								{member}
							</option>
						))}
					</select>
					<button
						className={styles.calendarButton}
						onClick={handleCalendarAdd}
					>
						📅 Add to Calendar
					</button>
				</div>
			</div>

			{showUnlockForm && <UnlockForm />}
			<AddMemberForm
				isVisible={showAddMemberForm}
				onClose={() => setShowAddMemberForm(false)}
				onSubmit={() => Promise.resolve()}
			/>
			{showEditCard && (
				<FloatingEdit
					show={showEditCard}
					onClose={() => {
						setShowEditCard(false);
						fetchSchedules();
					}}
					church={church}
					department={department}
					monthData={
						schedules[editCardId] || {
							date: editCardId,
							members: [],
						}
					}
				/>
			)}
		</>
	);
}

// Helper function to add ordinal suffixes (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(n: number): string {
	if (n > 3 && n < 21) return "th";
	switch (n % 10) {
		case 1:
			return "st";
		case 2:
			return "nd";
		case 3:
			return "rd";
		default:
			return "th";
	}
}
