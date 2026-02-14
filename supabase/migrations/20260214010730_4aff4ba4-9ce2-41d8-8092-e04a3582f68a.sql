CREATE POLICY "Users can delete their own agent config"
ON public.agent_configs FOR DELETE
USING (auth.uid() = user_id);