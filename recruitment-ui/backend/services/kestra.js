const axios = require("axios");
require("dotenv").config();

const KESTRA_BASE = process.env.KESTRA_BASE || "http://localhost:8080/api/v1";
const KESTRA_USERNAME = process.env.KESTRA_USERNAME || "";
const KESTRA_PASSWORD = process.env.KESTRA_PASSWORD || "";
const HAS_BASIC_AUTH = Boolean(KESTRA_USERNAME && KESTRA_PASSWORD);

const headers = { "Content-Type": "application/json" };

const kestraClient = axios.create({
  baseURL: KESTRA_BASE,
  timeout: 15000,
  headers,
  auth: HAS_BASIC_AUTH
    ? { username: KESTRA_USERNAME, password: KESTRA_PASSWORD }
    : undefined,
});

/**
 * Trigger a Kestra workflow execution
 */
async function triggerWorkflow(namespace, flowId, inputs = {}) {
  try {
    const res = await kestraClient.post(`/executions/${namespace}/${flowId}`, {
      inputs,
    });
    return {
      executionId: res.data.id,
      state: res.data.state?.current || "CREATED",
      startDate: res.data.state?.startDate || new Date().toISOString(),
    };
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    throw new Error(`Failed to trigger workflow ${flowId}: ${msg}`);
  }
}

/**
 * Trigger a Kestra workflow via webhook (no auth required)
 */
async function triggerWorkflowWebhook(
  namespace,
  flowId,
  triggerKey,
  body = {},
) {
  try {
    const res = await kestraClient.post(
      `/executions/webhook/${namespace}/${flowId}/${triggerKey}`,
      body,
    );
    return {
      executionId: res.data.id,
      state: res.data.state?.current || "CREATED",
      startDate: res.data.state?.startDate || new Date().toISOString(),
    };
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    throw new Error(`Failed to trigger workflow ${flowId}: ${msg}`);
  }
}

/**
 * Get a single execution by ID
 */
async function getExecution(executionId) {
  try {
    const res = await kestraClient.get(`/executions/${executionId}`);
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    throw new Error(`Failed to get execution ${executionId}: ${msg}`);
  }
}

/**
 * Get recent executions for a specific flow
 */
async function getExecutionsByFlow(namespace, flowId, pageSize = 10) {
  try {
    const res = await kestraClient.get("/executions", {
      params: { namespace, flowId, size: pageSize },
    });
    return res.data?.results || res.data || [];
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    throw new Error(`Failed to get executions for ${flowId}: ${msg}`);
  }
}

/**
 * Get all flows in a namespace
 */
async function getFlowsList(namespace) {
  try {
    const res = await kestraClient.get(`/flows/${namespace}`);
    return res.data || [];
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    throw new Error(`Failed to get flows for namespace ${namespace}: ${msg}`);
  }
}

module.exports = {
  triggerWorkflow,
  triggerWorkflowWebhook,
  getExecution,
  getExecutionsByFlow,
  getFlowsList,
  hasBasicAuth: HAS_BASIC_AUTH,
};
