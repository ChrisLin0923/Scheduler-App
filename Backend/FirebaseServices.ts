import { db } from "./FirebaseConfig";
import {
	collection,
	doc,
	getDocs,
	setDoc,
	query,
	where,
	addDoc,
} from "firebase/firestore";

interface Member {
	name: string;
	role: string[];
	service_group: string[];
}

export class PraiseTeamService {
	static async getAllMembers(churchId: string): Promise<Member[]> {
		try {
			const membersRef = collection(db, `churches/${churchId}/members`);
			const querySnapshot = await getDocs(membersRef);

			return querySnapshot.docs.map((doc) => ({
				...doc.data(),
				id: doc.id,
			})) as unknown as Member[];
		} catch (error) {
			console.error("Error retrieving members:", error);
			throw error; // Rethrow the error for further handling
		}
	}

	static async addMember(member: any, churchId: string) {
		const exists = await this.checkIfMemberExists(member.name, churchId);
		if (exists) {
			throw new Error("Member already exists");
		}

		const memberRef = collection(db, `churches/${churchId}/members`);
		await addDoc(memberRef, {
			...member,
			name: member.name.toLowerCase(),
		});
	}

	static async checkIfMemberExists(
		name: string,
		churchId: string
	): Promise<boolean> {
		const membersRef = collection(db, `churches/${churchId}/members`);
		const q = query(membersRef, where("name", "==", name.toLowerCase()));
		const querySnapshot = await getDocs(q);
		return !querySnapshot.empty;
	}

	static async getSchedules(churchId: string, department: string) {
		const schedulesRef = collection(
			db,
			`churches/${churchId}/teams/${department}/schedules`
		);
		const querySnapshot = await getDocs(schedulesRef);
		return querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));
	}

	static async updateSchedule(
		churchId: string,
		department: string,
		scheduleData: any
	) {
		const scheduleRef = doc(
			db,
			`churches/${churchId}/teams/${department}/schedules/${scheduleData.date}`
		);
		await setDoc(scheduleRef, scheduleData, { merge: true });
	}
}
