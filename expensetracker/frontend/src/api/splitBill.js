// src/api/splitBill.js
import api from "./axios";


export const fetchMyGroups = () => api.get("split-groups/");

export const createGroup = async (groupData) => api.post("/split-groups/", groupData);
export const fetchPendingInvites = () => api.get("split-groups/my-invites/");
export const sendGroupInvite = (groupId, username) =>
  api.post(`split-groups/${groupId}/send-invite/`, { user_identifier: username });
export const respondToInvite = (inviteId, action) =>
  api.post(`split-groups/invites/${inviteId}/respond/`, { action });
export const addGroupExpense = (groupId, data) =>
  api.post(`split-groups/${groupId}/expenses/`, data);
export const fetchGroupBalances = (groupId) =>
  api.get(`split-groups/${groupId}/balances/`);
export const recordSettlement = (data) =>
  api.post("split-groups/settle/", data);
export const fetchSettlementHistory = (groupId) =>
  api.get(`/split-groups/${groupId}/settlement-history/`);

export const confirmSettlement = (settlementId, action) =>
  api.post(`/settlements/${settlementId}/confirm/`, { action });