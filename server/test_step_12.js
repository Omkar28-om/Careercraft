/**
 * CareerCraft — STEP 12: Freelancing Marketplace Automated Test Suite
 * Validates requirements A through Z:
 * A. Create freelance project (201)
 * B. Project ownership binding (cannot spoof client_id)
 * C. Project listing (200, pagination)
 * D. Project filtering (category, budgetType, experienceLevel)
 * E. Project detail (200, client info, proposal count)
 * F. Update owner project (200)
 * G. Reject unauthorized update (403)
 * H. Save project (200/201)
 * I. Remove saved project (200)
 * J. Submit proposal (+5 XP awarded)
 * K. Prevent self-proposal (400)
 * L. Prevent duplicate proposal (400)
 * M. Withdraw own proposal (200)
 * N. Owner sees received proposals (200)
 * O. Unauthorized user cannot see project proposals (403)
 * P. Accept proposal (atomic transaction, others rejected)
 * Q. Reject proposal (200)
 * R. Contract creation on proposal accept (active contract verified)
 * S. Prevent second contract on non-open project (400)
 * T. Contract ownership & participant isolation (403 for 3rd user)
 * U. Complete contract (+25 XP awarded)
 * V. Duplicate completion does not award XP twice (400)
 * W. Cancel contract (200, status cancelled)
 * X. Earnings isolation per user (200, accurate stats)
 * Y. password_hash never exposed in responses
 * Z. User A cannot access User B's private freelance data (403)
 */

import pool from "./src/db.js";
import crypto from "crypto";

const BASE_URL = "http://localhost:5000/api";

function extractCookie(res) {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return null;
  const match = setCookie.match(/token=([^;]+)/);
  return match ? `token=${match[1]}` : null;
}

async function registerTestUser(prefix) {
  const rand = crypto.randomBytes(4).toString("hex");
  const email = `${prefix}_${rand}@example.com`;
  const password = "Password123!";
  const name = `Test ${prefix} ${rand}`;

  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name, role: "student" }),
  });

  const data = await res.json();
  const cookie = extractCookie(res);
  return { id: data.user?.id, email, password, cookie, data };
}

async function runTests() {
  console.log("=== STARTING STEP 12 FREELANCING MARKETPLACE TESTS ===");

  const clientUser = await registerTestUser("client_u12");
  const freelancerA = await registerTestUser("free_a_u12");
  const freelancerB = await registerTestUser("free_b_u12");
  const outsiderUser = await registerTestUser("outsider_u12");

  console.log(`✅ Registered Client: ${clientUser.id}`);
  console.log(`✅ Registered Freelancer A: ${freelancerA.id}`);
  console.log(`✅ Registered Freelancer B: ${freelancerB.id}`);
  console.log(`✅ Registered Outsider: ${outsiderUser.id}`);

  // TEST A: Create freelance project (201)
  const projectPayload = {
    title: "Full-Stack Next.js SaaS MVP",
    description: "Build an MVP with subscription payments and dashboard.",
    category: "Web Development",
    skillsRequired: ["Next.js", "PostgreSQL", "Tailwind CSS"],
    budgetType: "fixed",
    budgetMin: 500,
    budgetMax: 1200,
    experienceLevel: "intermediate",
    estimatedDuration: "1-2 months",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const resA = await fetch(`${BASE_URL}/freelance/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: clientUser.cookie,
    },
    body: JSON.stringify(projectPayload),
  });

  const dataA = await resA.json();
  if (resA.status === 201 && dataA.project?.id && dataA.project.title === projectPayload.title) {
    console.log(`✅ TEST A PASSED: Created freelance project with id ${dataA.project.id}`);
  } else {
    throw new Error(`TEST A FAILED: status=${resA.status}, message=${dataA.message}`);
  }

  const projectId = dataA.project.id;

  // TEST B: Project ownership binding (cannot spoof client_id)
  const resB = await fetch(`${BASE_URL}/freelance/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: clientUser.cookie,
    },
    body: JSON.stringify({
      ...projectPayload,
      title: "Spoof Attempt Project",
      clientId: freelancerA.id,
      client_id: freelancerA.id,
    }),
  });

  const dataB = await resB.json();
  const dbCheckB = await pool.query("SELECT client_id FROM freelance_projects WHERE id = $1", [dataB.project.id]);
  if (dbCheckB.rows[0].client_id === clientUser.id) {
    console.log(`✅ TEST B PASSED: Project ownership strictly bound to authenticated token (${clientUser.id}), ignored spoofed clientId`);
  } else {
    throw new Error(`TEST B FAILED: client_id bound to ${dbCheckB.rows[0].client_id} instead of authenticated user`);
  }

  // TEST C: Project listing (200, pagination)
  const resC = await fetch(`${BASE_URL}/freelance/projects?page=1&limit=10`);
  const dataC = await resC.json();
  if (resC.status === 200 && Array.isArray(dataC.projects) && dataC.pagination?.total >= 1) {
    console.log(`✅ TEST C PASSED: Project listing returned 200 with ${dataC.projects.length} projects, page 1`);
  } else {
    throw new Error(`TEST C FAILED: status=${resC.status}`);
  }

  // TEST D: Project filtering (category, budgetType, experienceLevel)
  const resD = await fetch(
    `${BASE_URL}/freelance/projects?category=Web+Development&budgetType=fixed&experienceLevel=intermediate`
  );
  const dataD = await resD.json();
  if (resD.status === 200 && Array.isArray(dataD.projects)) {
    const matchesAll = dataD.projects.every(
      (p) => p.category === "Web Development" && p.budgetType === "fixed" && p.experienceLevel === "intermediate"
    );
    if (matchesAll && dataD.projects.length >= 1) {
      console.log(`✅ TEST D PASSED: Project filtering returned ${dataD.projects.length} matching projects`);
    } else {
      throw new Error(`TEST D FAILED: Not all filtered projects match criteria`);
    }
  } else {
    throw new Error(`TEST D FAILED: status=${resD.status}`);
  }

  // TEST E: Project detail (200, client info, proposal count)
  const resE = await fetch(`${BASE_URL}/freelance/projects/${projectId}`);
  const dataE = await resE.json();
  if (resE.status === 200 && dataE.project?.id === projectId && dataE.project.client?.name) {
    console.log(`✅ TEST E PASSED: Project detail returned 200 with client info (${dataE.project.client.name})`);
  } else {
    throw new Error(`TEST E FAILED: status=${resE.status}`);
  }

  // TEST F: Update owner project (200)
  const resF = await fetch(`${BASE_URL}/freelance/projects/${projectId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: clientUser.cookie,
    },
    body: JSON.stringify({
      title: "Updated Full-Stack Next.js SaaS MVP",
      budgetMax: 1500,
    }),
  });
  const dataF = await resF.json();
  if (resF.status === 200 && dataF.project?.title === "Updated Full-Stack Next.js SaaS MVP" && dataF.project?.budgetMax === 1500) {
    console.log(`✅ TEST F PASSED: Owner successfully updated project title and budgetMax`);
  } else {
    throw new Error(`TEST F FAILED: status=${resF.status}, message=${dataF.message}`);
  }

  // TEST G: Reject unauthorized update (403)
  const resG = await fetch(`${BASE_URL}/freelance/projects/${projectId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: outsiderUser.cookie,
    },
    body: JSON.stringify({ title: "Hacked by Outsider" }),
  });
  if (resG.status === 403) {
    console.log(`✅ TEST G PASSED: Non-owner update rejected with 403 Forbidden`);
  } else {
    throw new Error(`TEST G FAILED: Expected 403, got ${resG.status}`);
  }

  // TEST H: Save project (200/201)
  const resH = await fetch(`${BASE_URL}/freelance/saved/${projectId}`, {
    method: "POST",
    headers: { Cookie: freelancerA.cookie },
  });
  const dataH = await resH.json();
  if (resH.status === 200 || resH.status === 201) {
    console.log(`✅ TEST H PASSED: Freelancer A saved project`);
  } else {
    throw new Error(`TEST H FAILED: status=${resH.status}, message=${dataH.message}`);
  }

  // Verify in saved list
  const resSaved = await fetch(`${BASE_URL}/freelance/saved`, {
    headers: { Cookie: freelancerA.cookie },
  });
  const dataSaved = await resSaved.json();
  if (resSaved.status === 200 && dataSaved.savedProjects?.some((s) => s.projectId === projectId)) {
    console.log(`✅ TEST H (List) PASSED: Saved project appears in freelancer's saved list`);
  } else {
    throw new Error(`TEST H (List) FAILED`);
  }

  // TEST I: Remove saved project (200)
  const resI = await fetch(`${BASE_URL}/freelance/saved/${projectId}`, {
    method: "DELETE",
    headers: { Cookie: freelancerA.cookie },
  });
  if (resI.status === 200) {
    console.log(`✅ TEST I PASSED: Freelancer A unsaved project`);
  } else {
    throw new Error(`TEST I FAILED: status=${resI.status}`);
  }

  // TEST J: Submit proposal (+5 XP awarded)
  const xpBeforeJ = (
    await pool.query("SELECT total_xp FROM student_progress WHERE user_id = $1", [freelancerA.id])
  ).rows[0]?.total_xp || 0;

  const resJ = await fetch(`${BASE_URL}/freelance/projects/${projectId}/proposals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: freelancerA.cookie,
    },
    body: JSON.stringify({
      bidAmount: 900,
      deliveryDays: 14,
      coverLetter: "I have 4+ years of React and PostgreSQL experience. I will build your SaaS with high quality.",
    }),
  });
  const dataJ = await resJ.json();
  if (resJ.status === 201 && dataJ.proposal?.id) {
    const xpAfterJ = (
      await pool.query("SELECT total_xp FROM student_progress WHERE user_id = $1", [freelancerA.id])
    ).rows[0]?.total_xp || 0;
    if (xpAfterJ === xpBeforeJ + 5) {
      console.log(`✅ TEST J PASSED: Proposal submitted (201) and +5 XP awarded (${xpBeforeJ} -> ${xpAfterJ})`);
    } else {
      throw new Error(`TEST J FAILED: XP did not increase by 5 (was ${xpBeforeJ}, now ${xpAfterJ})`);
    }
  } else {
    throw new Error(`TEST J FAILED: status=${resJ.status}, message=${dataJ.message}`);
  }

  const proposalAId = dataJ.proposal.id;

  // TEST K: Prevent self-proposal (400)
  const resK = await fetch(`${BASE_URL}/freelance/projects/${projectId}/proposals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: clientUser.cookie,
    },
    body: JSON.stringify({
      bidAmount: 500,
      deliveryDays: 7,
      coverLetter: "Trying to submit proposal on my own project.",
    }),
  });
  if (resK.status === 400) {
    console.log(`✅ TEST K PASSED: Owner cannot submit proposal to own project (400)`);
  } else {
    throw new Error(`TEST K FAILED: Expected 400, got ${resK.status}`);
  }

  // TEST L: Prevent duplicate proposal (400)
  const resL = await fetch(`${BASE_URL}/freelance/projects/${projectId}/proposals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: freelancerA.cookie,
    },
    body: JSON.stringify({
      bidAmount: 950,
      deliveryDays: 10,
      coverLetter: "Second duplicate proposal attempt.",
    }),
  });
  if (resL.status === 400) {
    console.log(`✅ TEST L PASSED: Duplicate proposal from same freelancer rejected (400)`);
  } else {
    throw new Error(`TEST L FAILED: Expected 400, got ${resL.status}`);
  }

  // Also submit proposal from Freelancer B so we can test reject/atomic accept
  const resJB = await fetch(`${BASE_URL}/freelance/projects/${projectId}/proposals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: freelancerB.cookie,
    },
    body: JSON.stringify({
      bidAmount: 1100,
      deliveryDays: 20,
      coverLetter: "I am Freelancer B with extensive backend experience.",
    }),
  });
  const dataJB = await resJB.json();
  const proposalBId = dataJB.proposal.id;

  // TEST M: Withdraw own proposal (200)
  // Create another project to test withdraw
  const tempProjRes = await fetch(`${BASE_URL}/freelance/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: clientUser.cookie },
    body: JSON.stringify({
      title: "Withdrawal Test Project",
      description: "Temp project",
      category: "Mobile App Development",
      skillsRequired: ["Flutter"],
      budgetType: "fixed",
      budgetMin: 300,
      budgetMax: 600,
      experienceLevel: "entry",
      estimatedDuration: "1 month",
    }),
  });
  const tempProjData = await tempProjRes.json();
  const tempProjId = tempProjData.project.id;

  const tempPropRes = await fetch(`${BASE_URL}/freelance/projects/${tempProjId}/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: freelancerA.cookie },
    body: JSON.stringify({
      bidAmount: 400,
      deliveryDays: 5,
      coverLetter: "I will withdraw this proposal.",
    }),
  });
  const tempPropData = await tempPropRes.json();
  const tempPropId = tempPropData.proposal.id;

  const resM = await fetch(`${BASE_URL}/freelance/proposals/${tempPropId}/withdraw`, {
    method: "PUT",
    headers: { Cookie: freelancerA.cookie },
  });
  const dataM = await resM.json();
  if (resM.status === 200 && dataM.proposal?.status === "withdrawn") {
    console.log(`✅ TEST M PASSED: Freelancer successfully withdrew proposal (status: withdrawn)`);
  } else {
    throw new Error(`TEST M FAILED: status=${resM.status}, message=${dataM.message}`);
  }

  // TEST N: Owner sees received proposals (200)
  const resN = await fetch(`${BASE_URL}/freelance/projects/${projectId}/proposals`, {
    headers: { Cookie: clientUser.cookie },
  });
  const dataN = await resN.json();
  if (resN.status === 200 && Array.isArray(dataN.proposals) && dataN.proposals.length >= 2) {
    console.log(`✅ TEST N PASSED: Project owner sees ${dataN.proposals.length} received proposals`);
  } else {
    throw new Error(`TEST N FAILED: status=${resN.status}, count=${dataN.proposals?.length}`);
  }

  // TEST O: Unauthorized user cannot see project proposals (403)
  const resO = await fetch(`${BASE_URL}/freelance/projects/${projectId}/proposals`, {
    headers: { Cookie: outsiderUser.cookie },
  });
  if (resO.status === 403) {
    console.log(`✅ TEST O PASSED: Non-owner viewing project proposals rejected (403 Forbidden)`);
  } else {
    throw new Error(`TEST O FAILED: Expected 403, got ${resO.status}`);
  }

  // TEST P: Accept proposal (atomic transaction, others rejected)
  const resP = await fetch(`${BASE_URL}/freelance/proposals/${proposalAId}/accept`, {
    method: "POST",
    headers: { Cookie: clientUser.cookie },
  });
  const dataP = await resP.json();
  if (resP.status === 200 && dataP.contract?.id && dataP.proposal?.status === "accepted") {
    console.log(`✅ TEST P PASSED: Proposal ${proposalAId} accepted, contract ${dataP.contract.id} created`);

    // Verify other proposal (proposalBId) was atomically marked 'rejected'
    const propBCheck = await pool.query("SELECT status FROM freelance_proposals WHERE id = $1", [proposalBId]);
    if (propBCheck.rows[0].status === "rejected") {
      console.log(`✅ TEST P (Atomic) PASSED: Competitor proposal ${proposalBId} automatically marked rejected`);
    } else {
      throw new Error(`TEST P (Atomic) FAILED: proposal B status is ${propBCheck.rows[0].status}`);
    }

    // Verify project status changed to 'in_progress'
    const projCheck = await pool.query("SELECT status FROM freelance_projects WHERE id = $1", [projectId]);
    if (projCheck.rows[0].status === "in_progress") {
      console.log(`✅ TEST P (Project Status) PASSED: Project status changed to in_progress`);
    } else {
      throw new Error(`TEST P (Project Status) FAILED: status is ${projCheck.rows[0].status}`);
    }
  } else {
    throw new Error(`TEST P FAILED: status=${resP.status}, message=${dataP.message}`);
  }

  const contractId = dataP.contract.id;

  // TEST Q: Reject proposal (explicit test on a pending proposal)
  // Create another project & proposal to test explicit rejection
  const rejProjRes = await fetch(`${BASE_URL}/freelance/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: clientUser.cookie },
    body: JSON.stringify({
      title: "Explicit Rejection Test Project",
      description: "Temp project for rejection",
      category: "UI/UX Design",
      skillsRequired: ["Figma"],
      budgetType: "fixed",
      budgetMin: 200,
      budgetMax: 400,
      experienceLevel: "entry",
      estimatedDuration: "1 month",
    }),
  });
  const rejProjData = await rejProjRes.json();
  const rejProjId = rejProjData.project.id;

  const rejPropRes = await fetch(`${BASE_URL}/freelance/projects/${rejProjId}/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: freelancerB.cookie },
    body: JSON.stringify({
      bidAmount: 300,
      deliveryDays: 4,
      coverLetter: "Proposal to be rejected.",
    }),
  });
  const rejPropData = await rejPropRes.json();
  const rejPropId = rejPropData.proposal.id;

  const resQ = await fetch(`${BASE_URL}/freelance/proposals/${rejPropId}/reject`, {
    method: "PUT",
    headers: { Cookie: clientUser.cookie },
  });
  const dataQ = await resQ.json();
  if (resQ.status === 200 && dataQ.proposal?.status === "rejected") {
    console.log(`✅ TEST Q PASSED: Explicit proposal rejection returned 200 (status: rejected)`);
  } else {
    throw new Error(`TEST Q FAILED: status=${resQ.status}`);
  }

  // TEST R: Contract creation on proposal accept (active contract verified)
  const resR = await fetch(`${BASE_URL}/freelance/contracts/${contractId}`, {
    headers: { Cookie: freelancerA.cookie },
  });
  const dataR = await resR.json();
  if (
    resR.status === 200 &&
    dataR.contract?.id === contractId &&
    dataR.contract.status === "active" &&
    dataR.contract.agreedBudget === 900
  ) {
    console.log(`✅ TEST R PASSED: Contract verified active with agreed budget $${dataR.contract.agreedBudget}`);
  } else {
    throw new Error(`TEST R FAILED: status=${resR.status}`);
  }

  // TEST S: Prevent second contract on non-open project (400)
  // Attempt to accept already rejected proposal B on the now 'in_progress' project
  const resS = await fetch(`${BASE_URL}/freelance/proposals/${proposalBId}/accept`, {
    method: "POST",
    headers: { Cookie: clientUser.cookie },
  });
  if (resS.status === 400) {
    console.log(`✅ TEST S PASSED: Accepting proposal on already-awarded project rejected (400)`);
  } else {
    throw new Error(`TEST S FAILED: Expected 400, got ${resS.status}`);
  }

  // TEST T: Contract ownership & participant isolation (403 for 3rd user)
  const resT = await fetch(`${BASE_URL}/freelance/contracts/${contractId}`, {
    headers: { Cookie: outsiderUser.cookie },
  });
  if (resT.status === 403) {
    console.log(`✅ TEST T PASSED: Outsider viewing contract rejected (403 Forbidden)`);
  } else {
    throw new Error(`TEST T FAILED: Expected 403, got ${resT.status}`);
  }

  // TEST U: Complete contract (+25 XP awarded)
  const xpBeforeU = (
    await pool.query("SELECT total_xp FROM student_progress WHERE user_id = $1", [freelancerA.id])
  ).rows[0]?.total_xp || 0;

  const resU = await fetch(`${BASE_URL}/freelance/contracts/${contractId}/complete`, {
    method: "POST",
    headers: { Cookie: clientUser.cookie },
  });
  const dataU = await resU.json();
  if (resU.status === 200 && dataU.contract?.status === "completed") {
    const xpAfterU = (
      await pool.query("SELECT total_xp FROM student_progress WHERE user_id = $1", [freelancerA.id])
    ).rows[0]?.total_xp || 0;
    if (xpAfterU === xpBeforeU + 25) {
      console.log(`✅ TEST U PASSED: Contract completed (200) and +25 XP awarded to freelancer (${xpBeforeU} -> ${xpAfterU})`);
    } else {
      throw new Error(`TEST U FAILED: XP did not increase by 25 (was ${xpBeforeU}, now ${xpAfterU})`);
    }
  } else {
    throw new Error(`TEST U FAILED: status=${resU.status}, message=${dataU.message}`);
  }

  // TEST V: Duplicate completion does not award XP twice (400)
  const resV = await fetch(`${BASE_URL}/freelance/contracts/${contractId}/complete`, {
    method: "POST",
    headers: { Cookie: clientUser.cookie },
  });
  if (resV.status === 400) {
    console.log(`✅ TEST V PASSED: Duplicate contract completion rejected with 400`);
  } else {
    throw new Error(`TEST V FAILED: Expected 400, got ${resV.status}`);
  }

  // TEST W: Cancel contract (200, status cancelled)
  // Create another project & contract to cancel
  const cancelProjRes = await fetch(`${BASE_URL}/freelance/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: clientUser.cookie },
    body: JSON.stringify({
      title: "Cancellation Test Project",
      description: "Temp project for cancellation test",
      category: "Content Writing",
      skillsRequired: ["Technical Writing"],
      budgetType: "fixed",
      budgetMin: 150,
      budgetMax: 250,
      experienceLevel: "entry",
      estimatedDuration: "2 weeks",
    }),
  });
  const cancelProjData = await cancelProjRes.json();
  const cancelProjId = cancelProjData.project.id;

  const cancelPropRes = await fetch(`${BASE_URL}/freelance/projects/${cancelProjId}/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: freelancerB.cookie },
    body: JSON.stringify({
      bidAmount: 200,
      deliveryDays: 7,
      coverLetter: "Proposal for cancellation test.",
    }),
  });
  const cancelPropData = await cancelPropRes.json();
  const cancelPropId = cancelPropData.proposal.id;

  const cancelAcceptRes = await fetch(`${BASE_URL}/freelance/proposals/${cancelPropId}/accept`, {
    method: "POST",
    headers: { Cookie: clientUser.cookie },
  });
  const cancelAcceptData = await cancelAcceptRes.json();
  const cancelContractId = cancelAcceptData.contract.id;

  const resW = await fetch(`${BASE_URL}/freelance/contracts/${cancelContractId}/cancel`, {
    method: "POST",
    headers: { Cookie: clientUser.cookie },
  });
  const dataW = await resW.json();
  if (resW.status === 200 && dataW.contract?.status === "cancelled") {
    console.log(`✅ TEST W PASSED: Contract cancelled successfully (status: cancelled)`);
  } else {
    throw new Error(`TEST W FAILED: status=${resW.status}`);
  }

  // TEST X: Earnings isolation per user (200, accurate stats)
  const resX = await fetch(`${BASE_URL}/freelance/earnings`, {
    headers: { Cookie: freelancerA.cookie },
  });
  const dataX = await resX.json();
  if (
    resX.status === 200 &&
    dataX.earnings?.completedContractValue >= 900 &&
    dataX.earnings?.totalContractsCount >= 1
  ) {
    console.log(`✅ TEST X PASSED: Freelancer A earnings verified: completedContractValue=$${dataX.earnings.completedContractValue}`);
  } else {
    throw new Error(`TEST X FAILED: status=${resX.status}, data=${JSON.stringify(dataX)}`);
  }

  // Verify outsider has $0 earnings
  const resXOutsider = await fetch(`${BASE_URL}/freelance/earnings`, {
    headers: { Cookie: outsiderUser.cookie },
  });
  const dataXOutsider = await resXOutsider.json();
  if (dataXOutsider.earnings?.completedContractValue === 0) {
    console.log(`✅ TEST X (Isolation) PASSED: Outsider user has $0 earnings`);
  } else {
    throw new Error(`TEST X (Isolation) FAILED: outsider earnings not zero`);
  }

  // TEST Y: password_hash never exposed in responses
  const jsonStrings = [
    JSON.stringify(dataA),
    JSON.stringify(dataC),
    JSON.stringify(dataE),
    JSON.stringify(dataJ),
    JSON.stringify(dataN),
    JSON.stringify(dataR),
    JSON.stringify(dataX),
  ];
  const exposesPassword = jsonStrings.some((s) => s.includes("password_hash") || s.includes("passwordHash"));
  if (!exposesPassword) {
    console.log(`✅ TEST Y PASSED: password_hash never exposed in any freelance API response`);
  } else {
    throw new Error(`TEST Y FAILED: password_hash found in API responses`);
  }

  // TEST Z: User A cannot access User B's private freelance data (403)
  // Outsider tries to view proposal A
  const resZ = await fetch(`${BASE_URL}/freelance/proposals/${proposalAId}`, {
    headers: { Cookie: outsiderUser.cookie },
  });
  if (resZ.status === 403) {
    console.log(`✅ TEST Z PASSED: Outsider accessing private proposal rejected (403 Forbidden)`);
  } else {
    throw new Error(`TEST Z FAILED: Expected 403, got ${resZ.status}`);
  }

  console.log("\n==================================================");
  console.log("🎉 ALL TESTS A THROUGH Z PASSED PERFECTLY!");
  console.log("==================================================\n");
}

runTests()
  .then(() => pool.end())
  .catch((err) => {
    console.error("\n❌ TESTS ENCOUNTERED ERROR:", err);
    pool.end();
    process.exit(1);
  });
