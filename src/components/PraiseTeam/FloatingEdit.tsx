import React, { useState, useEffect } from "react";
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
	teamType: string;
	monthData: {
		date: string;
		members: {
			role: string;
			name: string;
		}[];
	};
}

const DEFAULT_ROLES = [
	{ role: "Lead Singer", name: "" },
	{ role: "Vocalist", name: "" },
	{ role: "Guitarist", name: "" },
	{ role: "Bassist", name: "" },
	{ role: "Drummer", name: "" },
	{ role: "Pianist", name: "" },
];

const FloatingEdit = ({
	show,
	onClose,
	teamType,
	monthData,
}: FloatingEditProps) => {
	const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
	const [selectedMembers, setSelectedMembers] = useState<{
		[key: string]: string;
	}>(
		// Initialize with current assignments
		monthData.members.reduce(
			(acc, member) => ({
				...acc,
				[member.role]: member.name,
			}),
			{}
		)
	);

	useEffect(() => {
		const fetchMembers = async () => {
			const members = await PraiseTeamService.getAllMembers("162nd");
			setAvailableMembers(members);
		};
		fetchMembers();
	}, []);

	const getMembersForRole = (role: string) => {
		return availableMembers.filter((member) => {
			const hasRole = member.role.some(
				(r) => r.toLowerCase() === role.toLowerCase()
			);
			const hasServiceGroup = member.service_group.some(
				(sg) => sg.toLowerCase() === teamType.toLowerCase()
			);
			return hasRole && hasServiceGroup;
		});
	};

	const handleSave = async () => {
		try {
			await PraiseTeamService.updateSchedule("162nd", "praise_team", {
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

	const members =
		monthData.members?.length > 0 ? monthData.members : DEFAULT_ROLES;

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
					{members.map((member, index) => (
						<div key={index} className={styles.memberRow}>
							<h4>{member.role}</h4>
							<select
								className={styles.memberSelect}
								value={selectedMembers[member.role] || ""}
								onChange={(e) => {
									setSelectedMembers((prev) => ({
										...prev,
										[member.role]: e.target.value,
									}));
								}}
							>
								<option value=''>Select member</option>
								{getMembersForRole(member.role).map(
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
				<div className={styles.footer}>
					<button onClick={onClose} className={styles.cancelButton}>
						Cancel
					</button>
					<button className={styles.saveButton} onClick={handleSave}>
						Save Changes
					</button>
				</div>
			</div>
		</>
	);
};

export default FloatingEdit;
