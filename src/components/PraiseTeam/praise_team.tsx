import { useState, useEffect } from "react";
import styles from "./praise_team.module.css";
import { format, startOfMonth, endOfMonth, eachWeekOfInterval } from "date-fns";
import AddMemberForm from "./AddMemberForm";
import FloatingEdit from "./FloatingEdit";
import { PraiseTeamService } from "../../../Backend/FirebaseServices";

interface MonthCardProps {
	month: string;
	schedules: { [key: string]: any };
	onCardClick: (month: string) => void;
}

interface PraiseTeamEditProps {
	month: string;
	members: {
		role: string;
		name: string;
	}[];
}

const MonthCard = ({ month, schedules, onCardClick }: MonthCardProps) => {
	const schedule = schedules[month] || { members: [] };

	return (
		<div className={styles.card} onClick={() => onCardClick(month)}>
			<div className={styles.cardDate}>{month}</div>
			<div className={styles.memberList}>
				{schedule.members.map(
					(member: { role: string; name: string }, index: number) => (
						<div key={index} className={styles.memberItem}>
							<span className={styles.role}>{member.role}:</span>
							<span>{member.name}</span>
						</div>
					)
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
	const CHURCH_ID = "162nd";
	const TEAM_ID = "praise_team";

	const [searchQuery, setSearchQuery] = useState("");
	const [selectedRange, setSelectedRange] = useState(getCurrentQuarter());
	const [showNav, setShowNav] = useState(false);
	const [showAddMemberForm, setShowAddMemberForm] = useState(false);
	const [unlocked, setUnlocked] = useState(false);
	const [showUnlockForm, setShowUnlockForm] = useState(false);
	const [showEditCard, setShowEditCard] = useState(false);
	const [editCardId, setEditCardId] = useState("");
	const currentRange = MONTH_RANGES[selectedRange]; //index 0 - 3

	const memberList = [
		{ role: "Lead Singer", name: "Chris Lin" },
		{ role: "Vocalist", name: "Chris Lin, John Lin" },
		{ role: "Guitarist", name: "Chris Lin" },
		{ role: "Bassist", name: "Chris Lin" },
		{ role: "Drummer", name: "Chris Lin" },
		{ role: "Pianist", name: "Chris Lin" },
		{ role: "Custom", name: "Chris Lin" },
	];

	function getCurrentQuarter(): number {
		const currentMonth = new Date().getMonth(); // 0-11
		return Math.floor(currentMonth / 3);
	}

	const UnlockForm = () => {
		const [password, setPassword] = useState("");

		const handleUnlock = () => {
			if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
				setUnlocked(true);
				setShowUnlockForm(false);
			} else {
				alert("Incorrect password");
			}
		};

		return (
			<>
				<div
					className={styles.overlay}
					onClick={() => setShowUnlockForm(false)}
				>
					<div className={styles.unlockForm}>
						<h1>Unlock Editing Mode</h1>
						<input
							type='password'
							placeholder='Enter password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							onKeyPress={(e) =>
								e.key === "Enter" && handleUnlock()
							}
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
			</>
		);
	};

	const [schedules, setSchedules] = useState<{ [key: string]: any }>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchSchedules = async () => {
			try {
				const data = await PraiseTeamService.getSchedules(
					CHURCH_ID,
					TEAM_ID
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

		fetchSchedules();
	}, []);

	return (
		<>
			<div className={styles.container}>
				<div className={styles.header}>
					<button
						className={styles.navToggle}
						onClick={() => setShowNav(!showNav)}
					>
						☰
					</button>
					<input
						type='text'
						placeholder='Search schedules...'
						className={styles.searchBar}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
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
						onClick={() => setShowAddMemberForm(!showAddMemberForm)}
						disabled={!unlocked}
					>
						+ Add New
					</button>
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
					<select className={styles.userSelect}>
						<option value=''>Chris Lin</option>
						<option value='admin'>Admin View</option>
					</select>
					<button className={styles.calendarButton}>
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
					onClose={() => setShowEditCard(false)}
					teamType='162 Praise Team'
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
