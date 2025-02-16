import { useState, useEffect } from "react";
import styles from "./FloatingEdit.module.css";
import { PraiseTeamService } from "../../../Backend/FirebaseServices";

interface Member {
	name: string;
	role: string[];
	service_group: string[];
}

interface FloatingEditProps {
	show: boolean;
	onClose: () => void;
	church: string;
	department: string;
	monthData: {
		date: string;
		members: {
			role: string;
			name: string;
		}[];
	};
}

interface Conflict {
	type: "SAME_PERSON" | "ROLE_CONFLICT";
	message: string;
	severity: "WARNING" | "ERROR";
}

interface Conflict {
	type: "SAME_PERSON" | "ROLE_CONFLICT";
	message: string;
	severity: "WARNING" | "ERROR";
}

const PRAISE_ROLES = [
	{ role: "Lead Singer", name: "" },
	{ role: "Vocalist", name: "" },
	{ role: "Vocalist 2", name: "" },
	{ role: "Guitarist", name: "" },
	{ role: "Bassist", name: "" },
	{ role: "Drummer", name: "" },
	{ role: "Pianist", name: "" },
];
const AV_ROLES = [
	{ role: "PPT", name: "" },
	{ role: "Audio/Video", name: "" },
];

const GENERAL_ROLES = [
	{ role: "Offering", name: "" },
	{ role: "Usher", name: "" },
	{ role: "Doxology", name: "" },
	{ role: "Scripture Reading", name: "" },
];

const FloatingEdit = ({
	show,
	onClose,
	church,
	department,
	monthData,
}: FloatingEditProps) => {
	const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
	const [selectedMembers, setSelectedMembers] = useState<{
		[key: string]: string;
	}>({});
	const [conflicts, setConflicts] = useState<Conflict[]>([]);
	const [roles, setRoles] = useState(PRAISE_ROLES);

	useEffect(() => {
		const fetchMembers = async () => {
			const members = await PraiseTeamService.getAllMembers(church);
			setAvailableMembers(members);
		};

		fetchMembers();
	}, []);

	useEffect(() => {
		if (department === "audio_video") setRoles(AV_ROLES);
		else if (department === "general") setRoles(GENERAL_ROLES);
		else setRoles(PRAISE_ROLES);
	}, [department]); //When department changes, we will reset the roles to be rendered.

	// Initialize selectedMembers with current assignments
	useEffect(() => {
		const initialMembers: { [key: string]: string } = {};
		monthData.members.forEach((member) => {
			initialMembers[member.role] = member.name;
		});
		setSelectedMembers(initialMembers);
	}, [monthData]);

	const getMembersForRole = (role: string) => {
		// Normalize the role to "Vocalist" if it's "Vocalist 2"
		const normalizedRole = role === "Vocalist 2" ? "Vocalist" : role;

		return availableMembers.filter((member) => {
			const hasRole = member.role.some(
				(r) => r.toLowerCase() === normalizedRole.toLowerCase()
			);

			return hasRole;
		});
	};

	const handleSave = async () => {
		try {
			await PraiseTeamService.updateSchedule(church, department, {
				date: monthData.date,
				members: Object.entries(selectedMembers).map(
					([role, name]) => ({
						role,
						name,
					})
				),
				updatedAt: new Date().toISOString(),
			});

			onClose();
		} catch (error) {
			console.error("Error saving schedule:", error);
		}
	};

	const handleMemberSelect = (role: string, name: string) => {
		if (!name) {
			setConflicts([]);
			setSelectedMembers((prev) => ({
				...prev,
				[role]: name,
			}));

			return;
		}

		// Check for conflicts
		const newConflicts: Conflict[] = [];

		// Check if person is already assigned to another role
		const existingRole = Object.entries(selectedMembers).find(
			([r, n]) => n === name && r !== role
		);

		if (existingRole) {
			newConflicts.push({
				type: "SAME_PERSON",
				message: `${name} is already assigned as ${existingRole[0]}`,
				severity: "ERROR",
			});
		}

		setConflicts(newConflicts);
		setSelectedMembers((prev) => ({
			...prev,
			[role]: name,
		}));
	};

	if (!show) return null;

	return (
		<>
			<div className={styles.overlay} onClick={onClose} />
			<div className={styles.floatingEdit}>
				<div className={styles.header}>
					<h2>{monthData.date}</h2>
					<button onClick={onClose} className={styles.closeButton}>
						×
					</button>
				</div>
				<div className={styles.content}>
					{roles.map((role) => (
						<div key={role.role} className={styles.memberRow}>
							<h4>{role.role}</h4>
							<select
								className={styles.memberSelect}
								value={selectedMembers[role.role] || ""}
								onChange={(e) =>
									handleMemberSelect(
										role.role,
										e.target.value
									)
								}
							>
								<option value=''>Select member</option>
								{getMembersForRole(role.role).map(
									(availableMember) => (
										<option
											key={availableMember.name}
											value={availableMember.name}
										>
											{availableMember.name}
										</option>
									)
								)}
							</select>
						</div>
					))}
				</div>
				{conflicts.length > 0 && (
					<div className={styles.conflictWarnings}>
						{conflicts.map((conflict, index) => (
							<div
								key={index}
								className={`${styles.conflictMessage} ${
									styles[conflict.severity.toLowerCase()]
								}`}
							>
								⚠️ {conflict.message}
							</div>
						))}
					</div>
				)}
				<div className={styles.footer}>
					<button onClick={onClose} className={styles.cancelButton}>
						Cancel
					</button>
					<button
						className={styles.saveButton}
						disabled={conflicts.some((c) => c.severity === "ERROR")}
						onClick={handleSave}
					>
						Save Changes
					</button>
				</div>
			</div>
		</>
	);
};

export default FloatingEdit;
