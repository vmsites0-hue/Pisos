"use server";
import * as cashClosureService from "../services/cash-closures.service";

export const closeCash = cashClosureService.closeCash;
export const reopenClosure = cashClosureService.reopenClosure;
