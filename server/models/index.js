/**
 * Models Index
 * Central export point for all models.
 * Uses Mongoose models when a real MongoDB URI is present.
 * Falls back to a small in-memory implementation when the URI is missing or still a placeholder.
 */

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import UserModel from "./User.js";
import ProjectModel from "./Project.js";
import TaskModel from "./Task.js";

const readMongoUriHint = () => {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return "";
  }

  const envFile = fs.readFileSync(envPath, "utf-8");
  const match = envFile.match(/^MONGODB_URI\s*=\s*(.+)$/m);
  return match ? match[1].trim() : "";
};

const mongoUriHint = readMongoUriHint();
const useInMemoryStore =
  !mongoUriHint ||
  /username:password|<db_password>|your_mongodb_connection_string|cluster\.mongodb\.net|<your-mongodb-url>|your_mongodb_url/i.test(
    mongoUriHint,
  );

const cloneDoc = (doc) => (doc ? structuredClone(doc) : doc);

const toComparableDate = (value) => {
  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

const matchesCondition = (docValue, condition) => {
  if (
    condition &&
    typeof condition === "object" &&
    !(condition instanceof Date)
  ) {
    return Object.entries(condition).every(([operator, expectedValue]) => {
      if (operator === "$ne") {
        return docValue !== expectedValue;
      }

      if (operator === "$lt") {
        const left = toComparableDate(docValue);
        const right = toComparableDate(expectedValue);
        return left !== null && right !== null && left < right;
      }

      if (operator === "$lte") {
        const left = toComparableDate(docValue);
        const right = toComparableDate(expectedValue);
        return left !== null && right !== null && left <= right;
      }

      if (operator === "$gt") {
        const left = toComparableDate(docValue);
        const right = toComparableDate(expectedValue);
        return left !== null && right !== null && left > right;
      }

      if (operator === "$gte") {
        const left = toComparableDate(docValue);
        const right = toComparableDate(expectedValue);
        return left !== null && right !== null && left >= right;
      }

      if (operator === "$in") {
        return Array.isArray(expectedValue) && expectedValue.includes(docValue);
      }

      return docValue === expectedValue;
    });
  }

  if (Array.isArray(docValue)) {
    return docValue.includes(condition);
  }

  return docValue === condition;
};

class InMemoryQuery {
  constructor(model, filter = {}, single = false) {
    this.model = model;
    this.filter = { ...filter };
    this.single = single;
    this.sortSpec = null;
    this.populateField = null;
    this.pendingField = null;
  }

  where(field) {
    this.pendingField = field;
    return this;
  }

  equals(value) {
    if (this.pendingField) {
      this.filter[this.pendingField] = value;
      this.pendingField = null;
    }

    return this;
  }

  sort(sortSpec) {
    this.sortSpec = sortSpec;
    return this;
  }

  populate(field) {
    this.populateField = field;
    return this;
  }

  async exec() {
    let docs = this.model._findMatching(this.filter);

    if (this.sortSpec) {
      docs = this.model._sortDocs(docs, this.sortSpec);
    }

    if (this.populateField) {
      docs = docs.map((doc) =>
        this.model._populateDoc(doc, this.populateField),
      );
    }

    const cloned = docs.map((doc) => cloneDoc(doc));
    return this.single ? (cloned[0] ?? null) : cloned;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

class InMemoryModel {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  static _store = [];

  static _prepareSave(doc) {
    return doc;
  }

  static _clone(doc) {
    return cloneDoc(doc);
  }

  static _findMatching(filter = {}) {
    return this._store.filter((doc) => {
      return Object.entries(filter).every(([field, condition]) =>
        matchesCondition(doc[field], condition),
      );
    });
  }

  static _sortDocs(docs, sortSpec) {
    const sortEntries = Object.entries(sortSpec || {});
    if (sortEntries.length === 0) {
      return docs;
    }

    return [...docs].sort((leftDoc, rightDoc) => {
      for (const [field, direction] of sortEntries) {
        const leftValue = leftDoc[field];
        const rightValue = rightDoc[field];

        if (leftValue < rightValue) {
          return direction < 0 ? 1 : -1;
        }

        if (leftValue > rightValue) {
          return direction < 0 ? -1 : 1;
        }
      }

      return 0;
    });
  }

  static _populateDoc(doc, field) {
    return doc;
  }

  static find(filter = {}) {
    return new InMemoryQuery(this, filter, false);
  }

  static findOne(filter = {}) {
    return new InMemoryQuery(this, filter, true);
  }

  static findById(id) {
    return new InMemoryQuery(this, { _id: id }, true);
  }

  static async findByIdAndDelete(id) {
    const index = this._store.findIndex((doc) => doc._id === id);

    if (index === -1) {
      return null;
    }

    const [deleted] = this._store.splice(index, 1);

    return cloneDoc(deleted);
  }

  static async countDocuments(filter = {}) {
    return this._findMatching(filter).length;
  }

  async save() {
    this.constructor._prepareSave(this);

    if (!this._id) {
      this._id = randomUUID();
    }

    const now = new Date();
    if (!this.createdAt) {
      this.createdAt = now;
    }
    this.updatedAt = now;

    const serialized = cloneDoc(this);
    const existingIndex = this.constructor._store.findIndex(
      (doc) => doc._id === this._id,
    );

    if (existingIndex === -1) {
      this.constructor._store.push(serialized);
    } else {
      this.constructor._store[existingIndex] = serialized;
    }

    return this;
  }
}

class InMemoryUser extends InMemoryModel {
  static _store = [];
}

class InMemoryProject extends InMemoryModel {
  static _store = [];

  static _prepareSave(doc) {
    if (!Array.isArray(doc.members)) {
      doc.members = [];
    }

    if (doc.createdBy && !doc.members.includes(doc.createdBy)) {
      doc.members.unshift(doc.createdBy);
    }
  }

  static async findByIdAndDelete(id) {
    const deleted = await super.findByIdAndDelete(id);

    if (deleted) {
      InMemoryTask._store = InMemoryTask._store.filter(
        (task) => task.projectId !== id,
      );
    }

    return deleted;
  }
}

class InMemoryTask extends InMemoryModel {
  static _store = [];

  static _prepareSave(doc) {
    if (!doc.status) {
      doc.status = "Pending";
    }

    if (doc.dueDate && !(doc.dueDate instanceof Date)) {
      doc.dueDate = new Date(doc.dueDate);
    }
  }

  static _populateDoc(doc, field) {
    if (field === "projectId" && doc.projectId) {
      const project = InMemoryProject._store.find(
        (projectDoc) => projectDoc._id === doc.projectId,
      );

      return {
        ...doc,
        projectId: project ? cloneDoc(project) : doc.projectId,
      };
    }

    return doc;
  }
}

const User = useInMemoryStore ? InMemoryUser : UserModel;
const Project = useInMemoryStore ? InMemoryProject : ProjectModel;
const Task = useInMemoryStore ? InMemoryTask : TaskModel;

export { User, Project, Task, useInMemoryStore };
