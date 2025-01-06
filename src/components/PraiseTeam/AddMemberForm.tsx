import styles from "./AddMemberFrom.module.css";
import { PraiseTeamService } from "../../../Backend/FirebaseServices";
import { useState, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import debounce from "lodash/debounce";
import { format } from "date-fns";

interface Members {
	name: string;
	role: string[];
	service_group: string[];
	unavailable_dates?: string[];
}

interface AddMemberFormProps {
	isVisible: boolean;
	onClose: () => void;
	onSubmit: () => Promise<void>;
}

const ROLES = [
	"Lead Singer",
	"Vocalist",
	"Guitarist",
	"Bassist",
	"Drummer",
	"Pianist",
];

const SERVICE_GROUPS = ["162 Praise Team", "162 General Team", "162 Tech Team"];

const AddMemberForm: React.FC<AddMemberFormProps> = ({
	isVisible,
	onClose,
	onSubmit,
}) => {
	const [formData, setFormData] = useState<Members>({
		name: "",
		role: [],
		service_group: [],
		unavailable_dates: [],
	});
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [memberExists, setMemberExists] = useState(false);

	const handleRoleToggle = (role: string) => {
		setFormData((prev) => ({
			...prev,
			role: prev.role.includes(role)
				? prev.role.filter((r) => r !== role)
				: [...prev.role, role],
		}));
	};

	const handleServiceGroupToggle = (group: string) => {
		setFormData((prev) => ({
			...prev,
			service_group: prev.service_group.includes(group)
				? prev.service_group.filter((g) => g !== group)
				: [...prev.service_group, group],
		}));
	};

	const handleDateAdd = (date: Date | null) => {
		if (date) {
			const dateStr = date.toISOString().split("T")[0];
			setFormData((prev) => ({
				...prev,
				unavailable_dates: [...(prev.unavailable_dates || []), dateStr],
			}));
			setSelectedDate(null);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await PraiseTeamService.addMember(
				{
					name: formData.name,
					role: formData.role,
					service_group: formData.service_group,
					unavailable_dates: formData.unavailable_dates?.map((date) =>
						format(date, "yyyy-MM-dd")
					),
				},
				"162nd"
			);

			onSubmit();
			setFormData({
				name: "",
				role: [],
				service_group: [],
				unavailable_dates: [],
			});
			onClose();
		} catch (error) {
			console.error("Error adding member:", error);
			// Handle error (show message to user)
		}
	};

	const debouncedCheck = useCallback(
		debounce(async (name: string) => {
			if (name.trim()) {
				const exists = await PraiseTeamService.checkIfMemberExists(
					name,
					"162nd"
				);
				setMemberExists(exists);
			} else {
				setMemberExists(false);
			}
		}, 500),
		[]
	);

	if (!isVisible) return null;

	return (
		<div className={styles.overlay} onClick={onClose}>
			<div
				className={styles.addMemberForm}
				onClick={(e) => e.stopPropagation()}
			>
				<h1>Add Member</h1>
				<form onSubmit={handleSubmit}>
					<div className={styles.formGroup}>
						<label>Name</label>
						<input
							type='text'
							value={formData.name}
							onChange={(e) => {
								const newName = e.target.value;
								setFormData({ ...formData, name: newName });
								debouncedCheck(newName);
							}}
							className={`${styles.input} ${
								memberExists ? styles.error : ""
							}`}
							placeholder='Enter name'
							required
						/>
						{memberExists && (
							<p className={styles.errorText}>
								Member already exists
							</p>
						)}
					</div>

					<div className={styles.formGroup}>
						<label>Roles</label>
						<div className={styles.checkboxGroup}>
							{ROLES.map((role) => (
								<label key={role} className={styles.checkbox}>
									<input
										type='checkbox'
										checked={formData.role.includes(role)}
										onChange={() => handleRoleToggle(role)}
									/>
									{role}
								</label>
							))}
						</div>
					</div>

					<div className={styles.formGroup}>
						<label>Service Groups</label>
						<div className={styles.checkboxGroup}>
							{SERVICE_GROUPS.map((group) => (
								<label key={group} className={styles.checkbox}>
									<input
										type='checkbox'
										checked={formData.service_group.includes(
											group
										)}
										onChange={() =>
											handleServiceGroupToggle(group)
										}
									/>
									{group}
								</label>
							))}
						</div>
					</div>

					<div className={styles.formGroup}>
						<label>Unavailable Dates</label>
						<div className={styles.datePickerContainer}>
							<DatePicker
								selected={selectedDate}
								onChange={handleDateAdd}
								dateFormat='yyyy-MM-dd'
								placeholderText='Select dates'
								className={styles.datePicker}
							/>
						</div>
						<div className={styles.datesList}>
							{formData.unavailable_dates?.map((date, index) => (
								<div key={index} className={styles.dateTag}>
									{date}
									<button
										type='button'
										onClick={() =>
											setFormData((prev) => ({
												...prev,
												unavailable_dates:
													prev.unavailable_dates?.filter(
														(d) => d !== date
													),
											}))
										}
									>
										×
									</button>
								</div>
							))}
						</div>
					</div>

					<div className={styles.formActions}>
						<button
							type='button'
							onClick={onClose}
							className={styles.cancelButton}
						>
							Cancel
						</button>
						<button
							type='submit'
							className={styles.submitButton}
							disabled={memberExists}
						>
							Add Member
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AddMemberForm;
